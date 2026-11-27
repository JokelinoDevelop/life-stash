import { and, asc, eq } from "drizzle-orm";
import { Hono } from "hono";

import type { AppEnv } from "../../core/app-env";
import { inlineContentDisposition } from "../../core/content-disposition";
import { ApiError, badRequest } from "../../core/errors";
import { photoStorageFor } from "../../core/photo-storage";
import type { PhotoStorage } from "../../core/photo-storage";
import { validate } from "../../core/validate";
import { photos } from "../../db/schema/core";
import { createPhotoRequest } from "./dto/create-photo.request";
import type { CreatePhotoResponse } from "./dto/create-photo.response";
import { deletePhotoParams } from "./dto/delete-photo.request";
import type { DeletePhotoResponse } from "./dto/delete-photo.response";
import { listPhotosQuery } from "./dto/list-photos.request";
import type { ListPhotosResponse } from "./dto/list-photos.response";
import { uploadUrlRequest } from "./dto/upload-url.request";
import type { UploadUrlResponse } from "./dto/upload-url.response";
import {
  assertGeneratedPdfAllowed,
  assertPhotoOwner,
  deletePhoto,
} from "./photos.service";

const UPLOAD_URL_TTL = 600;
const VIEW_URL_TTL = 3600;

const EXTENSIONS = {
  "application/pdf": "pdf",
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
} as const;

/** `<uuid>.<ext>`: the file name part of a key the server issued. */
const ISSUED_FILE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(?<ext>jpg|png|webp|pdf)$/u;

/** The only key an upload for this owner may have: `<household>/<type>/<owner>/<uuid>.<ext>`. */
const isOwnObjectKey = (
  key: string,
  expected: {
    householdId: string;
    ownerType: string;
    ownerId: string;
    contentType: keyof typeof EXTENSIONS;
  }
): boolean => {
  const prefix = `${expected.householdId}/${expected.ownerType}/${expected.ownerId}/`;

  if (!key.startsWith(prefix)) {
    return false;
  }

  const file = ISSUED_FILE.exec(key.slice(prefix.length));

  return file?.groups?.ext === EXTENSIONS[expected.contentType];
};

/**
 * Served as the type recorded at upload (never what the file claims). PDFs open inline in a
 * new tab under their original name.
 */
const viewParams = (row: { contentType: string; fileName: string | null }) => {
  const served = { "response-content-type": row.contentType };

  if (row.contentType !== "application/pdf") {
    return served;
  }

  return {
    ...served,
    "response-content-disposition": inlineContentDisposition(
      row.fileName ?? "document.pdf"
    ),
  };
};

const requireStorage = (storage: PhotoStorage | null): PhotoStorage => {
  if (!storage) {
    throw new ApiError(
      503,
      "not_configured",
      "Photo storage is not configured"
    );
  }

  return storage;
};

export const photoRoutes = new Hono<AppEnv>()
  .post("/upload-url", validate("json", uploadUrlRequest), async (c) => {
    const storage = requireStorage(photoStorageFor(c.env));
    const input = c.req.valid("json");
    const { householdId } = c.var.auth;
    await assertPhotoOwner(c.var.db, householdId, input);
    const objectKey = `${householdId}/${input.ownerType}/${input.ownerId}/${crypto.randomUUID()}.${EXTENSIONS[input.contentType]}`;

    const body: UploadUrlResponse = {
      objectKey,
      // The upload must send exactly this type and size.
      uploadUrl: await storage.signedUrl("PUT", objectKey, {
        expiresInSeconds: UPLOAD_URL_TTL,
        headers: {
          "content-length": String(input.sizeBytes),
          "content-type": input.contentType,
        },
      }),
    };

    return c.json(body);
  })
  .post("/", validate("json", createPhotoRequest), async (c) => {
    const input = c.req.valid("json");
    const { householdId } = c.var.auth;

    if (!isOwnObjectKey(input.objectKey, { ...input, householdId })) {
      throw badRequest("Invalid object key");
    }

    await assertPhotoOwner(c.var.db, householdId, input);

    if (input.generated === true) {
      await assertGeneratedPdfAllowed(c.var.db, householdId, input.ownerId);
    }

    const [row] = await c.var.db
      .insert(photos)
      .values({
        ...input,
        fileName: input.fileName ?? null,
        generated: input.generated ?? false,
        householdId,
      })
      .returning({ id: photos.id });

    const body: CreatePhotoResponse = { id: row?.id ?? "" };

    return c.json(body, 201);
  })
  .get("/", validate("query", listPhotosQuery), async (c) => {
    const query = c.req.valid("query");
    const storage = photoStorageFor(c.env);

    const rows = storage
      ? await c.var.db
          .select()
          .from(photos)
          .where(
            and(
              eq(photos.householdId, c.var.auth.householdId),
              eq(photos.ownerType, query.ownerType),
              eq(photos.ownerId, query.ownerId)
            )
          )
          .orderBy(asc(photos.createdAt))
      : [];

    const body: ListPhotosResponse = {
      photos: await Promise.all(
        rows.map(async (row) => ({
          contentType: row.contentType,
          createdAt: row.createdAt,
          fileName: row.fileName,
          generated: row.generated,
          id: row.id,
          sizeBytes: row.sizeBytes,
          url:
            (await storage?.signedUrl("GET", row.objectKey, {
              expiresInSeconds: VIEW_URL_TTL,
              params: viewParams(row),
            })) ?? "",
        }))
      ),
    };

    return c.json(body);
  })
  .delete("/:photoId", validate("param", deletePhotoParams), async (c) => {
    await deletePhoto(
      c.env,
      c.var.db,
      c.var.auth.householdId,
      c.req.valid("param").photoId
    );
    const body: DeletePhotoResponse = { ok: true };

    return c.json(body);
  });
