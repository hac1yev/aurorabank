import axios from "axios";

export interface ApiErrorInfo {
  status?: number;
  code?: string;
  message?: string;
  retryAfter?: number;
  fields?: string[];
  matched?: boolean;
}

const toMessage = (message: unknown): string | undefined => {
  if (typeof message === "string") {
    return message;
  }
  if (
    Array.isArray(message) &&
    message.every((item) => typeof item === "string")
  ) {
    return message.join(" ");
  }
  return undefined;
};

/**
 * Reads the backend error body from an Axios error. Returns an empty object
 * when there is no response (network failure) or the error is not from Axios.
 */
export const getApiError = (error: unknown): ApiErrorInfo => {
  if (!axios.isAxiosError(error) || !error.response) {
    return {};
  }

  const status = error.response.status;
  const data: unknown = error.response.data;

  if (typeof data !== "object" || data === null) {
    return { status };
  }

  const body = data as Record<string, unknown>;

  return {
    status,
    code: typeof body.code === "string" ? body.code : undefined,
    message: toMessage(body.message),
    retryAfter:
      typeof body.retryAfter === "number" ? body.retryAfter : undefined,
    fields: Array.isArray(body.fields)
      ? body.fields.filter((field): field is string => typeof field === "string")
      : undefined,
    matched: typeof body.matched === "boolean" ? body.matched : undefined,
  };
};
