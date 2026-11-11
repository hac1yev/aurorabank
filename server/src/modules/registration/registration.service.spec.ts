import {
  BadRequestException,
  HttpException,
  InternalServerErrorException,
} from '@nestjs/common';
import { RegistrationService } from './registration.service';
import { PERSONAL_DETAILS_IP_LIMIT } from 'src/shared/constants/rate-limit.constants';

// uuid ships ESM-only builds that this Jest setup cannot load; token format is not under test here.
jest.mock('uuid', () => ({ v4: () => 'test-registration-token' }));
import { RegistrationSession } from './types/registration-session.interface';
import { PersonalDetailsDto } from './dtos/personal-details.dto';
import { UploadedFileLike } from './types/files.types';

const PERSONAL_DETAILS = {
  firstName: 'Ilkin',
  lastName: 'Haciyev',
  birthDate: new Date('1990-01-01'),
  citizenship: 'Azerbaijan',
  passportNumber: 'AB1234567',
  consent: true,
} as PersonalDetailsDto;

const SELFIE = {
  buffer: Buffer.from('selfie'),
  mimetype: 'image/jpeg',
  originalname: 'selfie.jpg',
  size: 6,
} as unknown as UploadedFileLike;

function createCounterRedis() {
  const counters = new Map<string, number>();
  return {
    incr: jest.fn((key: string) => {
      const next = (counters.get(key) ?? 0) + 1;
      counters.set(key, next);
      return Promise.resolve(next);
    }),
    ttl: jest.fn(() => Promise.resolve(3000)),
  };
}

describe('RegistrationService', () => {
  let service: RegistrationService;
  let consent: {
    storeConsent: jest.Mock;
    getConsentFromRedis: jest.Mock;
  };
  let ocr: { extractPassport: jest.Mock };
  let cloudinary: { downloadImage: jest.Mock };
  let face: { compareFaces: jest.Mock };
  let redis: ReturnType<typeof createCounterRedis>;
  let session: RegistrationSession | null;

  beforeEach(() => {
    session = { documentVerified: true, public_id: 'passports/abc' };
    consent = {
      storeConsent: jest.fn(() => Promise.resolve(undefined)),
      getConsentFromRedis: jest.fn(() => Promise.resolve(session)),
    };
    ocr = { extractPassport: jest.fn() };
    cloudinary = {
      downloadImage: jest.fn(() => Promise.resolve(Buffer.from('passport'))),
    };
    face = {
      compareFaces: jest.fn(() =>
        Promise.resolve({ matched: true, distance: 0.3 }),
      ),
    };
    redis = createCounterRedis();

    service = new RegistrationService(
      {} as never,
      ocr as never,
      consent as never,
      {} as never,
      {} as never,
      cloudinary as never,
      face as never,
      redis as never,
    );
  });

  describe('handlePersonalDetailsStep', () => {
    it('stores the session and returns a token for a client under the IP limit', async () => {
      const result = await service.handlePersonalDetailsStep(
        PERSONAL_DETAILS,
        '203.0.113.5',
      );

      expect(result.status).toBe('ok');
      expect(result.registrationToken).toEqual(expect.any(String));
      expect(consent.storeConsent).toHaveBeenCalledTimes(1);
    });

    it('rejects with 429 once one IP exceeds the limit, without storing a session', async () => {
      for (let i = 0; i < PERSONAL_DETAILS_IP_LIMIT; i++) {
        await service.handlePersonalDetailsStep(
          PERSONAL_DETAILS,
          '203.0.113.5',
        );
      }
      consent.storeConsent.mockClear();

      const error = await service
        .handlePersonalDetailsStep(PERSONAL_DETAILS, '203.0.113.5')
        .catch((e: unknown) => e);

      expect(error).toBeInstanceOf(HttpException);
      expect((error as HttpException).getStatus()).toBe(429);
      expect((error as HttpException).getResponse()).toMatchObject({
        code: 'PERSONAL_DETAILS_RATE_LIMITED',
        retryAfter: 3000,
      });
      expect(consent.storeConsent).not.toHaveBeenCalled();
    });

    it('limits each IP address separately', async () => {
      for (let i = 0; i < PERSONAL_DETAILS_IP_LIMIT; i++) {
        await service.handlePersonalDetailsStep(
          PERSONAL_DETAILS,
          '203.0.113.5',
        );
      }

      await expect(
        service.handlePersonalDetailsStep(PERSONAL_DETAILS, '198.51.100.9'),
      ).resolves.toMatchObject({ status: 'ok' });
    });
  });

  describe('getPassportInfoFromOcr', () => {
    it('passes HttpExceptions from OCR through unchanged', async () => {
      const original = new HttpException(
        { code: 'DOCUMENT_NOT_RECOGNIZED' },
        422,
      );
      ocr.extractPassport.mockRejectedValueOnce(original);

      await expect(service.getPassportInfoFromOcr('token-1', [])).rejects.toBe(
        original,
      );
    });

    it('wraps unexpected errors in a 500', async () => {
      ocr.extractPassport.mockRejectedValueOnce(new Error('openai down'));

      await expect(
        service.getPassportInfoFromOcr('token-1', []),
      ).rejects.toBeInstanceOf(InternalServerErrorException);
    });
  });

  describe('verifyFaceRecognition', () => {
    it('rejects the selfie when the passport document has not been verified', async () => {
      session = { public_id: 'passports/abc', documentVerified: false };

      await expect(
        service.verifyFaceRecognition('token-1', SELFIE),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(cloudinary.downloadImage).not.toHaveBeenCalled();
      expect(face.compareFaces).not.toHaveBeenCalled();
    });

    it('rejects the selfie when no verified document flag is present', async () => {
      session = { public_id: 'passports/abc' };

      await expect(
        service.verifyFaceRecognition('token-1', SELFIE),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('compares faces when the document was verified', async () => {
      await expect(
        service.verifyFaceRecognition('token-1', SELFIE),
      ).resolves.toEqual({ success: true, matched: true, distance: 0.3 });
      expect(face.compareFaces).toHaveBeenCalledTimes(1);
    });
  });
});
