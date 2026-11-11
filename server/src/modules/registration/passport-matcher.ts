export type MatchableField =
  | 'firstName'
  | 'lastName'
  | 'birthDate'
  | 'passportNumber'
  | 'citizenship';

type Nullable<T> = T | null | undefined;

// birthDate may be a Date (DTO type) or an ISO string (after the Redis JSON round-trip).
export interface PassportFieldValues {
  firstName?: Nullable<string>;
  lastName?: Nullable<string>;
  birthDate?: Nullable<string | Date>;
  passportNumber?: Nullable<string>;
  citizenship?: Nullable<string>;
}

// Azerbaijani letters that NFD decomposition does not fold to ASCII.
const LETTER_MAP: Record<string, string> = {
  ı: 'i',
  İ: 'I',
  ə: 'e',
  Ə: 'E',
  ğ: 'g',
  Ğ: 'G',
  ş: 's',
  Ş: 'S',
  ç: 'c',
  Ç: 'C',
  ö: 'o',
  Ö: 'O',
  ü: 'u',
  Ü: 'U',
};

// Nationality adjectives that refer to the same country as the country name.
const CITIZENSHIP_ALIASES: Record<string, string> = {
  AZERBAIJANI: 'AZERBAIJAN',
  AZE: 'AZERBAIJAN',
};

const DATE_PATTERN = /^(\d{4}-\d{2}-\d{2})(T.*)?$/;

export function normalizeName(value: string | null | undefined): string {
  if (!value) {
    return '';
  }
  const mapped = Array.from(
    value.normalize('NFC'),
    (ch) => LETTER_MAP[ch] ?? ch,
  )
    .join('')
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toUpperCase();
  return mapped.replace(/[^A-Z]/g, '');
}

export function normalizePassportNumber(
  value: string | null | undefined,
): string {
  if (!value) {
    return '';
  }
  return value.toUpperCase().replace(/[^A-Z0-9]/g, '');
}

export function normalizeCitizenship(value: string | null | undefined): string {
  const letters = normalizeName(value);
  return CITIZENSHIP_ALIASES[letters] ?? letters;
}

/**
 * Returns YYYY-MM-DD for a strict calendar date, or null when the value is
 * missing or not a valid date. Accepts a plain date or an ISO datetime
 * (the form the session holds after the Redis JSON round-trip).
 */
export function normalizeDate(
  value: string | Date | null | undefined,
): string | null {
  if (!value) {
    return null;
  }
  if (value instanceof Date) {
    return Number.isNaN(value.getTime())
      ? null
      : value.toISOString().slice(0, 10);
  }
  const match = DATE_PATTERN.exec(value.trim());
  if (!match) {
    return null;
  }
  const date = match[1];
  const [year, month, day] = date.split('-').map(Number);
  const check = new Date(Date.UTC(year, month - 1, day));
  const isValid =
    check.getUTCFullYear() === year &&
    check.getUTCMonth() === month - 1 &&
    check.getUTCDate() === day;
  return isValid ? date : null;
}

/** True when `a` and `b` differ by at most one insertion, deletion or substitution. */
export function isWithinOneEdit(a: string, b: string): boolean {
  if (a === b) {
    return true;
  }
  if (Math.abs(a.length - b.length) > 1) {
    return false;
  }

  let i = 0;
  let j = 0;
  let edits = 0;
  while (i < a.length && j < b.length) {
    if (a[i] === b[j]) {
      i++;
      j++;
      continue;
    }
    edits++;
    if (edits > 1) {
      return false;
    }
    if (a.length > b.length) {
      i++;
    } else if (b.length > a.length) {
      j++;
    } else {
      i++;
      j++;
    }
  }
  edits += a.length - i + (b.length - j);
  return edits <= 1;
}

function namesMatch(
  expected: string | null | undefined,
  extracted: string | null | undefined,
): boolean {
  const a = normalizeName(expected);
  const b = normalizeName(extracted);
  if (!a || !b) {
    return false;
  }
  return isWithinOneEdit(a, b);
}

function strictMatch(a: string, b: string): boolean {
  return a !== '' && a === b;
}

/**
 * Compares identity fields typed by the user (`expected`) with fields read
 * from the document (`extracted`). Missing values on either side count as a
 * mismatch. Only field names are returned, never the values.
 */
export function findMismatchedFields(
  expected: PassportFieldValues,
  extracted: PassportFieldValues,
): MatchableField[] {
  const mismatches: MatchableField[] = [];

  if (!namesMatch(expected.firstName, extracted.firstName)) {
    mismatches.push('firstName');
  }
  if (!namesMatch(expected.lastName, extracted.lastName)) {
    mismatches.push('lastName');
  }

  const expectedBirth = normalizeDate(expected.birthDate);
  const extractedBirth = normalizeDate(extracted.birthDate);
  if (!expectedBirth || !extractedBirth || expectedBirth !== extractedBirth) {
    mismatches.push('birthDate');
  }

  if (
    !strictMatch(
      normalizePassportNumber(expected.passportNumber),
      normalizePassportNumber(extracted.passportNumber),
    )
  ) {
    mismatches.push('passportNumber');
  }

  if (
    !strictMatch(
      normalizeCitizenship(expected.citizenship),
      normalizeCitizenship(extracted.citizenship),
    )
  ) {
    mismatches.push('citizenship');
  }

  return mismatches;
}
