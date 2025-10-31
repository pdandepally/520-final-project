/**
 * Helper file that abstracts functionality for uploading images to Supabase storage.
 *
 * @author Ajay Gandecha <agandecha@unc.edu>
 */

import { SupabaseClient } from "@supabase/supabase-js";

export const uploadAttachmentToSupabase = async (
  supabase: SupabaseClient,
  messageId: string,
  file: File,
  onSuccess: (attachmentUrl: string) => void
) => {
  const { data: fileData, error: uploadError } = await supabase.storage
    .from("attachments")
    .upload(`${messageId}`, file);

  if (uploadError) {
    console.error({
      code: "INTERNAL_SERVER_ERROR",
      message: `Failed to upload file to Supabase: ${uploadError.message}`,
    });
  } else {
    onSuccess(fileData.path);
  }
};

export const uploadServerImageToSupabase = async (
  supabase: SupabaseClient,
  file: File,
  onSuccess: (avatarUrl: string) => void
) => {
  const { data: fileData, error: uploadError } = await supabase.storage
    .from(`server_images`)
    .upload(`${file.name}`, file, { upsert: true });

  if (uploadError) {
    console.error({
      code: "INTERNAL_SERVER_ERROR",
      message: `Failed to upload file to Supabase: ${uploadError.message}`,
    });
  } else {
    onSuccess(fileData.path);
  }
};

export const uploadAvatarFileToSupabase = async (
  supabase: SupabaseClient,
  file: File,
  onSuccess: (avatarUrl: string) => void
) => {
  const { data: fileData, error: uploadError } = await supabase.storage
    .from(`avatars`)
    .upload(`${file.name}`, file, { upsert: true });

  if (uploadError) {
    console.error({
      code: "INTERNAL_SERVER_ERROR",
      message: `Failed to upload file to Supabase: ${uploadError.message}`,
    });
  } else {
    onSuccess(fileData.path);
  }
};
