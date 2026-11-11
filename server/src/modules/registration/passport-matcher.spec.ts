import {
  findMismatchedFields,
  isWithinOneEdit,
  normalizeCitizenship,
  normalizeDate,
  normalizeName,
  normalizePassportNumber,
} from './passport-matcher';

const session = {
  firstName: 'Ilkin',
  lastName: 'Haciyev',
  birthDate: '1990-01-01T00:00:00.000Z',
  passportNumber: 'AB1234567',
  citizenship: 'Azerbaijan',
};

const matchingDocument = {
  firstName: 'ILKIN',
  lastName: 'HACIYEV',
  birthDate: '1990-01-01',
  passportNumber: 'AB 1234567',
  citizenship: 'AZERBAIJAN',
};

describe('passport-matcher', () => {
  describe('normalizeName', () => {
    it('uppercases and strips diacritics, spacing and punctuation', () => {
      expect(normalizeName(' Jean-Luc  ')).toBe('JEANLUC');
      expect(normalizeName('Müller')).toBe('MULLER');
    });

    it('folds Azerbaijani letters', () => {
      expect(normalizeName('Hacıyev')).toBe('HACIYEV');
      expect(normalizeName('Əliyev')).toBe('ELIYEV');
      expect(normalizeName('Şəhla')).toBe('SEHLA');
    });

    it('returns an empty string for missing values', () => {
      expect(normalizeName(undefined)).toBe('');
      expect(normalizeName(null)).toBe('');
    });
  });

  describe('normalizePassportNumber', () => {
    it('ignores case, spaces and punctuation', () => {
      expect(normalizePassportNumber('ab-12 34567')).toBe('AB1234567');
    });
  });

  describe('normalizeCitizenship', () => {
    it('maps nationality adjectives to the country name', () => {
      expect(normalizeCitizenship('Azerbaijani')).toBe('AZERBAIJAN');
      expect(normalizeCitizenship('azerbaijan')).toBe('AZERBAIJAN');
    });
  });

  describe('normalizeDate', () => {
    it('accepts plain dates and ISO datetimes', () => {
      expect(normalizeDate('1990-01-01')).toBe('1990-01-01');
      expect(normalizeDate('1990-01-01T00:00:00.000Z')).toBe('1990-01-01');
    });

    it('rejects invalid calendar dates and other formats', () => {
      expect(normalizeDate('1990-02-30')).toBeNull();
      expect(normalizeDate('01/01/1990')).toBeNull();
      expect(normalizeDate('1990-01-01garbage')).toBeNull();
      expect(normalizeDate('')).toBeNull();
    });
  });

  describe('isWithinOneEdit', () => {
    it.each<[string, string, boolean]>([
      ['HACIYEV', 'HACIYEV', true],
      ['HACIYEV', 'HACIYV', true],
      ['HACIYEV', 'HACIYEVX', true],
      ['HACIYEV', 'HACYEV', true],
      ['HACIYEV', 'HACIEV', true],
      ['HACIYEV', 'HAZIYEV', true],
      ['HACIYEV', 'HAZIYXV', false],
      ['HACIYEV', 'HACI', false],
    ])('%s vs %s -> %s', (a, b, expected) => {
      expect(isWithinOneEdit(a, b)).toBe(expected);
    });
  });

  describe('findMismatchedFields', () => {
    it('returns no fields when the document matches the session', () => {
      expect(findMismatchedFields(session, matchingDocument)).toEqual([]);
    });

    it('tolerates one OCR error in a name', () => {
      expect(
        findMismatchedFields(session, {
          ...matchingDocument,
          lastName: 'HACIEV',
        }),
      ).toEqual([]);
    });

    it('reports a name that differs by more than one edit', () => {
      expect(
        findMismatchedFields(session, {
          ...matchingDocument,
          firstName: 'Orkhan',
        }),
      ).toEqual(['firstName']);
    });

    it('keeps birth date and passport number strict', () => {
      expect(
        findMismatchedFields(session, {
          ...matchingDocument,
          birthDate: '1990-01-02',
          passportNumber: 'AB1234568',
        }),
      ).toEqual(['birthDate', 'passportNumber']);
    });

    it('reports a different citizenship', () => {
      expect(
        findMismatchedFields(session, {
          ...matchingDocument,
          citizenship: 'Turkey',
        }),
      ).toEqual(['citizenship']);
    });

    it('treats missing values on either side as a mismatch', () => {
      expect(
        findMismatchedFields(session, {
          ...matchingDocument,
          firstName: null,
          passportNumber: '',
        }),
      ).toEqual(['firstName', 'passportNumber']);

      expect(
        findMismatchedFields(
          { ...session, citizenship: undefined },
          matchingDocument,
        ),
      ).toEqual(['citizenship']);
    });
  });
});
