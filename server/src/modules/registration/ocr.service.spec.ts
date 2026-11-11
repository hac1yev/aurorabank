import { HttpException, NotFoundException } from '@nestjs/common';
import { AiService, ExtractedPassportInfo } from '../ai/ai.service';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { AesGcmHelper } from 'src/shared/encryption/aes-gcm.helper';
import { RedisService } from 'src/shared/modules/redis/redis.service';
import {
  OCR_FAILURE_LIMIT,
  OCR_LOCK_TIME_SECONDS,
  OCR_REQUEST_LIMIT,
} from 'src/shared/constants/ocr.constants';
import { ConsentService } from './consent.service';
import { OcrService } from './ocr.service';
import { UploadedFileLike } from './types/files.types';
import { RegistrationSession } from './types/registration-session.interface';

const mockRecognize = jest.fn<Promise<unknown>, unknown[]>();

jest.mock('tesseract.js', () => ({
  __esModule: true,
  default: { recognize: (...args: unknown[]) => mockRecognize(...args) },
}));

const LONG_OCR_TEXT =
  'PASSPORT REPUBLIC OF AZERBAIJAN Surname HACIYEV Given names ILKIN Nationality AZERBAIJAN';

const GOOD_OCR_RESULT = { data: { text: LONG_OCR_TEXT, confidence: 85 } };

const GOOD_EXTRACTED: ExtractedPassportInfo = {
  isPassport: true,
  firstName: 'ILKIN',
  lastName: 'HACIYEV',
  passportNumber: 'AB1234567',
  birthDate: '1990-01-01',
  citizenship: 'AZERBAIJAN',
};

const PASSPORT_NUMBER = 'AB1234567';

function buildSession(): RegistrationSession {
  return {
    personalDetails: {
      firstName: 'Ilkin',
      lastName: 'Haciyev',
      birthDate: new Date('1990-01-01'),
      citizenship: 'Azerbaijan',
      passportNumber: PASSPORT_NUMBER,
      consent: true,
    },
  };
}

const FILES = [
  {
    buffer: Buffer.from('image-bytes'),
    mimetype: 'image/png',
    originalname: 'passport.png',
    size: 11,
  },
] as unknown as UploadedFileLike[];

function createFakeRedis() {
  const store = new Map<string, string>();
  const fake = {
    store,
    get: jest.fn((key: string) => Promise.resolve(store.get(key) ?? null)),
    set: jest.fn((key: string, value: string) => {
      store.set(key, value);
      return Promise.resolve();
    }),
    del: jest.fn((key: string) => Promise.resolve(store.delete(key) ? 1 : 0)),
    incr: jest.fn((key: string) => {
      const next = Number(store.get(key) ?? 0) + 1;
      store.set(key, String(next));
      return Promise.resolve(next);
    }),
    ttl: jest.fn(() => Promise.resolve(1800)),
  };
  return fake;
}

async function captureError(promise: Promise<unknown>): Promise<HttpException> {
  try {
    await promise;
  } catch (error) {
    if (error instanceof HttpException) {
      return error;
    }
    throw error;
  }
  throw new Error('Expected the promise to reject');
}

describe('OcrService', () => {
  let service: OcrService;
  let redis: ReturnType<typeof createFakeRedis>;
  let consent: {
    getConsentFromRedis: jest.Mock;
    storeUploadedDocument: jest.Mock;
  };
  let cloudinary: { uploadImage: jest.Mock };
  let ai: { extractPassportInfo: jest.Mock };
  let session: RegistrationSession | null;

  beforeEach(() => {
    mockRecognize.mockReset();
    mockRecognize.mockResolvedValue(GOOD_OCR_RESULT);

    redis = createFakeRedis();
    session = buildSession();

    consent = {
      getConsentFromRedis: jest.fn(() => Promise.resolve(session)),
      storeUploadedDocument: jest.fn(() => Promise.resolve(undefined)),
    };
    cloudinary = {
      uploadImage: jest.fn(() =>
        Promise.resolve({ public_id: 'passports/abc' }),
      ),
    };
    ai = {
      extractPassportInfo: jest.fn(() => Promise.resolve(GOOD_EXTRACTED)),
    };

    service = new OcrService(
      cloudinary as unknown as CloudinaryService,
      ai as unknown as AiService,
      consent as unknown as ConsentService,
      redis as unknown as RedisService,
      new AesGcmHelper(Buffer.alloc(32, 7)),
    );
  });

  it('rejects with 404 and calls no external service when the session is missing', async () => {
    session = null;

    await expect(service.extractPassport('token-1', FILES)).rejects.toThrow(
      NotFoundException,
    );
    expect(mockRecognize).not.toHaveBeenCalled();
    expect(ai.extractPassportInfo).not.toHaveBeenCalled();
    expect(cloudinary.uploadImage).not.toHaveBeenCalled();
  });

  it('returns the extracted fields and stores the image after a valid document', async () => {
    const result = await service.extractPassport('token-1', FILES);

    expect(result).toEqual({
      firstName: 'ILKIN',
      lastName: 'HACIYEV',
      passportNumber: 'AB1234567',
      birthDate: '1990-01-01',
      citizenship: 'AZERBAIJAN',
      public_id: 'passports/abc',
    });
    expect(cloudinary.uploadImage).toHaveBeenCalledTimes(1);
    expect(consent.storeUploadedDocument).toHaveBeenCalledWith(
      'token-1',
      'passports/abc',
    );
  });

  it('does not upload the image when validation fails', async () => {
    ai.extractPassportInfo.mockResolvedValueOnce(null);

    await captureError(service.extractPassport('token-1', FILES));

    expect(cloudinary.uploadImage).not.toHaveBeenCalled();
    expect(consent.storeUploadedDocument).not.toHaveBeenCalled();
  });

  it('returns DOCUMENT_NOT_RECOGNIZED for insufficient OCR text without calling OpenAI', async () => {
    mockRecognize.mockResolvedValueOnce({
      data: { text: '  ab ', confidence: 90 },
    });

    const error = await captureError(service.extractPassport('token-1', FILES));

    expect(error.getStatus()).toBe(422);
    expect(error.getResponse()).toMatchObject({
      code: 'DOCUMENT_NOT_RECOGNIZED',
    });
    expect(ai.extractPassportInfo).not.toHaveBeenCalled();
  });

  it('returns DOCUMENT_NOT_RECOGNIZED for low OCR confidence', async () => {
    mockRecognize.mockResolvedValueOnce({
      data: { text: LONG_OCR_TEXT, confidence: 10 },
    });

    const error = await captureError(service.extractPassport('token-1', FILES));

    expect(error.getResponse()).toMatchObject({
      code: 'DOCUMENT_NOT_RECOGNIZED',
    });
    expect(ai.extractPassportInfo).not.toHaveBeenCalled();
  });

  it('returns DOCUMENT_NOT_RECOGNIZED when the model says it is not a passport', async () => {
    ai.extractPassportInfo.mockResolvedValueOnce({
      ...GOOD_EXTRACTED,
      isPassport: false,
    });

    const error = await captureError(service.extractPassport('token-1', FILES));

    expect(error.getResponse()).toMatchObject({
      code: 'DOCUMENT_NOT_RECOGNIZED',
    });
  });

  it('returns DOCUMENT_NOT_RECOGNIZED when a required field is missing', async () => {
    ai.extractPassportInfo.mockResolvedValueOnce({
      ...GOOD_EXTRACTED,
      citizenship: null,
    });

    const error = await captureError(service.extractPassport('token-1', FILES));

    expect(error.getResponse()).toMatchObject({
      code: 'DOCUMENT_NOT_RECOGNIZED',
    });
  });

  it('returns MISMATCH with field names only when the passport differs from the typed details', async () => {
    ai.extractPassportInfo.mockResolvedValueOnce({
      ...GOOD_EXTRACTED,
      passportNumber: 'ZZ9999999',
    });

    const error = await captureError(service.extractPassport('token-1', FILES));

    expect(error.getStatus()).toBe(422);
    expect(error.getResponse()).toEqual({
      code: 'MISMATCH',
      message: expect.any(String),
      fields: ['passportNumber'],
    });
    expect(JSON.stringify(error.getResponse())).not.toContain('ZZ9999999');
    expect(cloudinary.uploadImage).not.toHaveBeenCalled();
  });

  it('does not count OpenAI/API errors as failed validations', async () => {
    ai.extractPassportInfo.mockRejectedValue(new Error('upstream unavailable'));

    for (let i = 0; i < OCR_FAILURE_LIMIT; i++) {
      await expect(service.extractPassport('token-1', FILES)).rejects.toThrow(
        'upstream unavailable',
      );
    }

    const keys = [...redis.store.keys()];
    expect(keys.some((k) => k.startsWith('ocr:failures:'))).toBe(false);
    expect(keys.some((k) => k.startsWith('ocr:lock:'))).toBe(false);
  });

  it('locks the passport after OCR_FAILURE_LIMIT consecutive failures', async () => {
    ai.extractPassportInfo.mockResolvedValue(null);

    for (let i = 1; i < OCR_FAILURE_LIMIT; i++) {
      const error = await captureError(
        service.extractPassport('token-1', FILES),
      );
      expect(error.getResponse()).toMatchObject({
        code: 'DOCUMENT_NOT_RECOGNIZED',
      });
    }

    const lockError = await captureError(
      service.extractPassport('token-1', FILES),
    );
    expect(lockError.getStatus()).toBe(429);
    expect(lockError.getResponse()).toMatchObject({
      code: 'OCR_LOCKED',
      retryAfter: OCR_LOCK_TIME_SECONDS,
    });

    const ocrCallsBeforeLocked = mockRecognize.mock.calls.length;
    const blocked = await captureError(
      service.extractPassport('token-1', FILES),
    );
    expect(blocked.getResponse()).toMatchObject({ code: 'OCR_LOCKED' });
    expect(mockRecognize.mock.calls.length).toBe(ocrCallsBeforeLocked);
  });

  it('keeps the lock for a new registration token with the same passport number', async () => {
    ai.extractPassportInfo.mockResolvedValue(null);

    for (let i = 0; i < OCR_FAILURE_LIMIT; i++) {
      await captureError(service.extractPassport('token-1', FILES));
    }

    const error = await captureError(service.extractPassport('token-2', FILES));
    expect(error.getResponse()).toMatchObject({ code: 'OCR_LOCKED' });
  });

  it('resets the consecutive failure counter after a successful validation', async () => {
    ai.extractPassportInfo.mockResolvedValueOnce(null);
    await captureError(service.extractPassport('token-1', FILES));
    ai.extractPassportInfo.mockResolvedValueOnce(null);
    await captureError(service.extractPassport('token-1', FILES));

    await service.extractPassport('token-1', FILES);

    ai.extractPassportInfo.mockResolvedValueOnce(null);
    const error = await captureError(service.extractPassport('token-1', FILES));
    expect(error.getResponse()).toMatchObject({
      code: 'DOCUMENT_NOT_RECOGNIZED',
    });
  });

  it('rate limits after OCR_REQUEST_LIMIT requests within the window', async () => {
    // Infrastructure errors consume the request budget without counting as failed documents,
    // so the failure lockout does not trigger first.
    ai.extractPassportInfo.mockRejectedValue(new Error('upstream unavailable'));

    for (let i = 0; i < OCR_REQUEST_LIMIT; i++) {
      await expect(service.extractPassport('token-1', FILES)).rejects.toThrow(
        'upstream unavailable',
      );
    }

    const error = await captureError(service.extractPassport('token-1', FILES));
    expect(error.getStatus()).toBe(429);
    expect(error.getResponse()).toMatchObject({
      code: 'OCR_RATE_LIMITED',
      retryAfter: 1800,
    });
  });

  it('applies the request limit per passport number across new tokens', async () => {
    ai.extractPassportInfo.mockRejectedValue(new Error('upstream unavailable'));

    for (let i = 0; i < OCR_REQUEST_LIMIT; i++) {
      await expect(
        service.extractPassport(`token-${i}`, FILES),
      ).rejects.toThrow('upstream unavailable');
    }

    const error = await captureError(
      service.extractPassport('fresh-token', FILES),
    );
    expect(error.getResponse()).toMatchObject({ code: 'OCR_RATE_LIMITED' });
  });

  it('never stores the raw passport number in Redis keys or values', async () => {
    ai.extractPassportInfo.mockResolvedValueOnce(null);
    await captureError(service.extractPassport('token-1', FILES));

    const serialized = [...redis.store.entries()].flat().join('|');
    expect(serialized).not.toContain(PASSPORT_NUMBER);
    expect(
      [...redis.store.keys()].every((k) => !k.includes(PASSPORT_NUMBER)),
    ).toBe(true);
  });
});
