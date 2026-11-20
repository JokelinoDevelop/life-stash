import {
  queryOptions,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";

import { api, unwrap } from "@/lib/api";
import type { SuccessBody } from "@/lib/api";
import { compressPhoto } from "@/modules/photos/compress";

import { financeKeys } from "../finance-keys";

export type AttachmentOwnerType = "finance_invoice" | "finance_transaction";

export interface AttachmentOwner {
  ownerType: AttachmentOwnerType;
  ownerId: string;
}

export const MAX_PDF_BYTES = 10 * 1024 * 1024;

const PDF = "application/pdf" as const;

export type Attachment = SuccessBody<
  Awaited<ReturnType<typeof api.photos.$get>>
>["photos"][number];

export const attachmentsQuery = (owner: AttachmentOwner) =>
  queryOptions({
    queryFn: async () => await unwrap(api.photos.$get({ query: owner })),
    queryKey: financeKeys.files(owner.ownerType, owner.ownerId),
    // Signed view URLs live for an hour; refresh well before they expire.
    staleTime: 30 * 60_000,
  });

/** PDFs go up as they are; images are resized and compressed first. */
const prepare = async (file: File) => {
  if (file.type === PDF) {
    return { blob: file, contentType: PDF };
  }

  return await compressPhoto(file);
};

const uploadOne = async (owner: AttachmentOwner, file: File): Promise<void> => {
  const { blob, contentType } = await prepare(file);

  const { objectKey, uploadUrl } = await unwrap(
    api.photos["upload-url"].$post({
      json: { ...owner, contentType, sizeBytes: blob.size },
    })
  );

  const response = await fetch(uploadUrl, {
    body: blob,
    headers: { "Content-Type": contentType },
    method: "PUT",
  });

  if (!response.ok) {
    throw new Error(`Upload failed with ${response.status}`);
  }

  await unwrap(
    api.photos.$post({
      json: {
        ...owner,
        contentType,
        fileName: file.name,
        objectKey,
        sizeBytes: blob.size,
      },
    })
  );
};

/** Keeps the PDF the app drew when issuing an invoice, marked `generated` (not removable). */
export const uploadGeneratedPdf = async (
  invoiceId: string,
  blob: Blob,
  fileName: string
): Promise<void> => {
  const owner = { ownerId: invoiceId, ownerType: "finance_invoice" } as const;
  const contentType = PDF;

  const { objectKey, uploadUrl } = await unwrap(
    api.photos["upload-url"].$post({
      json: { ...owner, contentType, sizeBytes: blob.size },
    })
  );

  const response = await fetch(uploadUrl, {
    body: blob,
    headers: { "Content-Type": contentType },
    method: "PUT",
  });

  if (!response.ok) {
    throw new Error(`Upload failed with ${response.status}`);
  }

  await unwrap(
    api.photos.$post({
      json: {
        ...owner,
        contentType,
        fileName,
        generated: true,
        objectKey,
        sizeBytes: blob.size,
      },
    })
  );
};

/** Uploads files to an owner; resolves with the names of those that failed. */
export const uploadFiles = async (
  owner: AttachmentOwner,
  files: readonly File[]
): Promise<string[]> => {
  const results = await Promise.allSettled(
    files.map(async (file) => {
      await uploadOne(owner, file);
    })
  );

  return files.flatMap((file, index) =>
    results[index]?.status === "rejected" ? [file.name] : []
  );
};

/** Uploads files one by one; resolves with the names of those that failed. */
export const useUploadAttachments = (owner: AttachmentOwner) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (files: File[]): Promise<string[]> =>
      await uploadFiles(owner, files),
    onSettled: async () => {
      await queryClient.invalidateQueries({ queryKey: financeKeys.all });
    },
  });
};

export const useDeleteAttachment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (photoId: string) =>
      await unwrap(api.photos[":photoId"].$delete({ param: { photoId } })),
    onSettled: async () => {
      await queryClient.invalidateQueries({ queryKey: financeKeys.all });
    },
  });
};
