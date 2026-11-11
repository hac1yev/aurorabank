import type { ApiErrorInfo } from "../../../utils/apiError";
import { formatCountdown } from "../hooks/useCountdown";

export type OcrErrorKind =
  | "locked"
  | "rateLimited"
  | "notRecognized"
  | "mismatch"
  | "sessionExpired"
  | "invalidFile"
  | "generic";

export interface OcrErrorView {
  kind: OcrErrorKind;
  title: string;
  message: string;
}

const FIELD_LABELS: Record<string, string> = {
  firstName: "First name",
  lastName: "Last name",
  birthDate: "Birth date",
  passportNumber: "Passport number",
  citizenship: "Citizenship",
};

/**
 * Maps a backend OCR error to user-facing copy. `remainingSeconds` is the live
 * countdown for lock/rate-limit errors. Field values are never shown, only labels.
 */
export const describeOcrError = (
  info: ApiErrorInfo,
  remainingSeconds: number,
): OcrErrorView => {
  switch (info.code) {
    case "OCR_LOCKED":
      return {
        kind: "locked",
        title: "Document checks locked",
        message: `Too many unsuccessful document checks. Try again in ${formatCountdown(remainingSeconds)}.`,
      };
    case "OCR_RATE_LIMITED":
      return {
        kind: "rateLimited",
        title: "Too many attempts",
        message: `You have reached the document check limit. Try again in ${formatCountdown(remainingSeconds)}.`,
      };
    case "DOCUMENT_NOT_RECOGNIZED":
      return {
        kind: "notRecognized",
        title: "Passport not recognized",
        message:
          "We could not read a passport from this image. Upload a clear, well-lit photo of the photo page with all corners visible and no glare.",
      };
    case "MISMATCH": {
      const labels = (info.fields ?? []).map(
        (field) => FIELD_LABELS[field] ?? field,
      );
      return {
        kind: "mismatch",
        title: "Details do not match",
        message:
          labels.length > 0
            ? `The passport does not match the details you entered (${labels.join(", ")}). Review and correct your personal details, then upload your passport again.`
            : "The passport does not match the details you entered. Review and correct your personal details, then upload your passport again.",
      };
    }
  }

  if (info.status === 404) {
    return {
      kind: "sessionExpired",
      title: "Session expired",
      message: "Your registration session has expired. Please start again.",
    };
  }

  if (info.status === 400 || info.status === 413 || info.status === 415) {
    return {
      kind: "invalidFile",
      title: "File not accepted",
      message:
        info.message ??
        "This file could not be accepted. Please choose another file.",
    };
  }

  return {
    kind: "generic",
    title: "Something went wrong",
    message: "We could not check your document. Please try again.",
  };
};
