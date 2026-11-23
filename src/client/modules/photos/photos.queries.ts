import {
  queryOptions,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";

import { api, unwrap } from "@/lib/api";
import type { SuccessBody } from "@/lib/api";

import { compressPhoto } from "./compress";

export type PhotoOwnerType = "car" | "service_visit" | "expense";

export interface PhotoOwner {
  ownerType: PhotoOwnerType;
  ownerId: string;
}

export type Photo = SuccessBody<
  Awaited<ReturnType<typeof api.photos.$get>>
>["photos"][number];

const photosKey = (owner: PhotoOwner) =>
  ["garage", "photos", owner.ownerType, owner.ownerId] as const;

export const photosQuery = (owner: PhotoOwner) =>
  queryOptions({
    queryFn: async () => await unwrap(api.photos.$get({ query: owner })),
    queryKey: photosKey(owner),
    // Signed view URLs live for an hour; refresh well before they expire.
    staleTime: 30 * 60_000,
  });

const uploadOne = async (owner: PhotoOwner, file: File): Promise<void> => {
  const { blob, contentType } = await compressPhoto(file);

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
      json: { ...owner, contentType, objectKey, sizeBytes: blob.size },
    })
  );
};

/** Uploads files one by one; resolves with the names of the files that failed. */
export const useUploadPhotos = (owner: PhotoOwner) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (files: File[]): Promise<string[]> => {
      const results = await Promise.allSettled(
        files.map(async (file) => {
          await uploadOne(owner, file);
        })
      );

      return files.flatMap((file, index) =>
        results[index]?.status === "rejected" ? [file.name] : []
      );
    },
    onSettled: async () => {
      await queryClient.invalidateQueries({ queryKey: ["garage"] });
    },
  });
};

export const useDeletePhoto = (owner: PhotoOwner) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (photoId: string) =>
      await unwrap(api.photos[":photoId"].$delete({ param: { photoId } })),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: photosKey(owner) });
      await queryClient.invalidateQueries({ queryKey: ["garage"] });
    },
  });
};
