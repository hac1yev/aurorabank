import dayjs from "dayjs";

const REVIEW_KEY = "personalDetailsReview";

export interface PersonalDetailsReview {
  /** Registration token the review belongs to. A review is only valid for that session. */
  registrationToken: string;
  /** Field names the passport did not match (server `fields`). */
  fields: string[];
  /** Normalised values at the time of the mismatch, used to require a real change. */
  snapshot: Record<string, string>;
}

/** Normalises a personal-details value so the same value always compares equal. */
export const toComparableValue = (field: string, value: unknown): string => {
  if (!value) {
    return "";
  }
  if (field === "birthDate") {
    return dayjs(value as string).format("YYYY-MM-DD");
  }
  return String(value).trim();
};

export const saveReview = (fields: string[]) => {
  const { personalDetails } = readUserInfo() as {
    personalDetails?: Record<string, unknown>;
  };
  const snapshot: Record<string, string> = {};

  fields.forEach((field) => {
    snapshot[field] = toComparableValue(field, personalDetails?.[field]);
  });

  const review: PersonalDetailsReview = {
    registrationToken: sessionStorage.getItem("registrationToken") ?? "",
    fields,
    snapshot,
  };
  sessionStorage.setItem(REVIEW_KEY, JSON.stringify(review));
};

/**
 * Returns the pending review only when it belongs to the current registration
 * session. A review left over from another session is discarded, so a fresh
 * first-time registration never takes the PATCH path.
 */
export const readReview = (): PersonalDetailsReview | null => {
  const raw = sessionStorage.getItem(REVIEW_KEY);
  const currentToken = sessionStorage.getItem("registrationToken");

  if (!raw) {
    return null;
  }

  let review: PersonalDetailsReview;
  try {
    review = JSON.parse(raw) as PersonalDetailsReview;
  } catch {
    clearReview();
    return null;
  }

  if (!currentToken || review.registrationToken !== currentToken) {
    clearReview();
    return null;
  }

  return review;
};

export const clearReview = () => {
  sessionStorage.removeItem(REVIEW_KEY);
};

const readUserInfo = (): Record<string, unknown> => {
  const raw = sessionStorage.getItem("userInfo");

  if (!raw) {
    return {};
  }

  try {
    return JSON.parse(raw) as Record<string, unknown>;
  } catch {
    return {};
  }
};

/**
 * Clears the registration token and step index, then reloads so the stepper
 * starts again from step 1. Personal details are kept (for prefill) when
 * `keepPersonalDetails` is true.
 */
export const restartRegistration = ({
  keepPersonalDetails,
}: {
  keepPersonalDetails: boolean;
}) => {
  const { personalDetails } = readUserInfo();

  sessionStorage.removeItem("registrationToken");
  sessionStorage.removeItem("activeStep");
  clearReview();

  if (keepPersonalDetails && personalDetails) {
    sessionStorage.setItem(
      "userInfo",
      JSON.stringify({ personalDetails }),
    );
  } else {
    sessionStorage.removeItem("userInfo");
  }

  window.location.reload();
};
