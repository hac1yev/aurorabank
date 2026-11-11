// Mirrors the server rules in server/src/shared/constants/files.constants.ts
// and server/src/shared/pipes/uploadValidation.pipe.ts.
export const ALLOWED_DOCUMENT_TYPES = ["image/jpeg", "image/png"];
export const ALLOWED_DOCUMENT_EXTENSIONS = [".jpg", ".jpeg", ".png"];
export const MAX_DOCUMENT_SIZE_BYTES = 10 * 1024 * 1024;
const FILENAME_ALLOWED_REGEX = /^[A-Za-z0-9 _.-]+$/;

/** Returns a user-facing reason when the file cannot be uploaded, otherwise null. */
export const validateDocumentFile = (file: File): string | null => {
  if (file.size === 0) {
    return "The selected file is empty. Please choose another file.";
  }

  if (file.size > MAX_DOCUMENT_SIZE_BYTES) {
    return "This file is too large. The maximum size is 10 MB.";
  }

  const dotIndex = file.name.lastIndexOf(".");
  const extension =
    dotIndex >= 0 ? file.name.slice(dotIndex).toLowerCase() : "";

  if (
    !ALLOWED_DOCUMENT_TYPES.includes(file.type) ||
    !ALLOWED_DOCUMENT_EXTENSIONS.includes(extension)
  ) {
    return "Unsupported file type. Please upload a JPG, JPEG or PNG image.";
  }

  const baseName = dotIndex >= 0 ? file.name.slice(0, dotIndex) : file.name;

  if (!FILENAME_ALLOWED_REGEX.test(baseName)) {
    return "The file name contains invalid characters. Please rename the file and try again.";
  }

  return null;
};
