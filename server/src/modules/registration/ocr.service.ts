import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import Tesseract, { RecognizeResult } from 'tesseract.js';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { UploadedFileLike } from './types/files.types';
import { AiService, ExtractedPassportInfo } from '../ai/ai.service';
import { ConsentService } from './consent.service';
import { RegistrationSession } from './types/registration-session.interface';
import { RedisService } from 'src/shared/modules/redis/redis.service';
import { AesGcmHelper } from 'src/shared/encryption/aes-gcm.helper';
import { consumeRateLimit } from 'src/shared/utils/rate-limit.util';
import {
  OCR_FAILURE_LIMIT,
  OCR_FAILURE_WINDOW_SECONDS,
  OCR_LOCK_TIME_SECONDS,
  OCR_MIN_CONFIDENCE,
  OCR_MIN_TEXT_LENGTH,
  OCR_REQUEST_LIMIT,
  OCR_REQUEST_WINDOW_SECONDS,
} from 'src/shared/constants/ocr.constants';
import {
  findMismatchedFields,
  MatchableField,
  normalizePassportNumber,
} from './passport-matcher';

type RecognizedPassport = ExtractedPassportInfo & {
  isPassport: true;
  firstName: string;
  lastName: string;
  passportNumber: string;
  birthDate: string;
  citizenship: string;
};

@Injectable()
export class OcrService {
  constructor(
    private cloudinaryService: CloudinaryService,
    private aiService: AiService,
    private consentService: ConsentService,
    private redisService: RedisService,
    private aesGcm: AesGcmHelper,
  ) {}

  // Request budget is counted per registration token and per passport number,
  // so starting a new token does not reset the limit.
  private getTokenRequestKey(registrationToken: string) {
    return `ocr:requests:token:${registrationToken}`;
  }

  private getPassportRequestKey(passportKey: string) {
    return `ocr:requests:passport:${passportKey}`;
  }

  private getFailureKey(passportKey: string) {
    return `ocr:failures:${passportKey}`;
  }

  private getLockKey(passportKey: string) {
    return `ocr:lock:${passportKey}`;
  }

  /** Redis-safe identifier derived from the typed passport number (never stored raw). */
  private getPassportKey(passportNumber: string): string {
    return this.aesGcm.keyedHash(
      'ocr-passport-lock',
      normalizePassportNumber(passportNumber),
    );
  }

  async extractPassport(registrationToken: string, files: UploadedFileLike[]) {
    const session =
      await this.consentService.getConsentFromRedis<RegistrationSession>(
        registrationToken,
      );

    if (!session?.personalDetails) {
      throw new NotFoundException('Registration session not found or expired');
    }

    const typed = session.personalDetails;
    // Pin the key on the first attempt so editing the passport number later
    // cannot move the lock, failure counter or request budget.
    const passportKey =
      session.ocrPassportKey ?? this.getPassportKey(typed.passportNumber);
    if (!session.ocrPassportKey) {
      await this.consentService.storeOcrPassportKey(
        registrationToken,
        passportKey,
      );
    }

    await this.ensureNotLocked(passportKey);
    await this.consumeRequestBudget(registrationToken, passportKey);

    const file = files[0];
    if (!file?.buffer) {
      throw new BadRequestException(
        'The selected file is empty. Please choose another file and try again.',
      );
    }

    const result: RecognizeResult = await Tesseract.recognize(
      file.buffer,
      'eng',
    );
    const text = result.data.text.trim();

    if (
      text.length < OCR_MIN_TEXT_LENGTH ||
      result.data.confidence < OCR_MIN_CONFIDENCE
    ) {
      throw await this.registerFailure(passportKey, this.notRecognizedError());
    }

    const extracted = await this.aiService.extractPassportInfo(text);
    console.log(extracted);
    if (!extracted || !this.isCompletePassport(extracted)) {
      throw await this.registerFailure(passportKey, this.notRecognizedError());
    }

    const mismatched = findMismatchedFields(typed, extracted);
    if (mismatched.length > 0) {
      throw await this.registerFailure(
        passportKey,
        this.mismatchError(mismatched),
      );
    }

    // Upload and persist only after the document has passed every check.
    const uploadedAsset = await this.cloudinaryService.uploadImage(files);

    const public_id = uploadedAsset?.public_id;
    if (!public_id) {
      throw new InternalServerErrorException(
        'Failed to store the passport image',
      );
    }

    await this.consentService.storeUploadedDocument(
      registrationToken,
      public_id,
    );
    await this.redisService.del(this.getFailureKey(passportKey));

    return {
      firstName: extracted.firstName,
      lastName: extracted.lastName,
      passportNumber: extracted.passportNumber,
      birthDate: extracted.birthDate,
      citizenship: extracted.citizenship,
      public_id,
    };
  }

  private isCompletePassport(
    extracted: ExtractedPassportInfo,
  ): extracted is RecognizedPassport {
    return (
      extracted.isPassport &&
      [
        extracted.firstName,
        extracted.lastName,
        extracted.passportNumber,
        extracted.birthDate,
        extracted.citizenship,
      ].every((value) => typeof value === 'string' && value.trim() !== '')
    );
  }

  private async ensureNotLocked(passportKey: string) {
    const lockKey = this.getLockKey(passportKey);
    const isLocked = await this.redisService.get(lockKey);

    if (isLocked) {
      const ttl = await this.redisService.ttl(lockKey);
      throw this.lockedError(ttl);
    }
  }

  private async consumeRequestBudget(
    registrationToken: string,
    passportKey: string,
  ) {
    // Both counters are always incremented so neither can be used to skip the other.
    const tokenRetry = await consumeRateLimit(
      this.redisService,
      this.getTokenRequestKey(registrationToken),
      OCR_REQUEST_LIMIT,
      OCR_REQUEST_WINDOW_SECONDS,
    );
    const passportRetry = await consumeRateLimit(
      this.redisService,
      this.getPassportRequestKey(passportKey),
      OCR_REQUEST_LIMIT,
      OCR_REQUEST_WINDOW_SECONDS,
    );

    const retryAfter = Math.max(tokenRetry ?? 0, passportRetry ?? 0);
    if (retryAfter > 0) {
      throw new HttpException(
        {
          code: 'OCR_RATE_LIMITED',
          message: `Too many document checks. Try again in ${retryAfter} seconds.`,
          retryAfter,
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
  }

  /**
   * Records a failed document validation and returns the error the caller should
   * throw: the lockout error when this failure reaches the limit, otherwise `error`.
   */
  private async registerFailure(
    passportKey: string,
    error: HttpException,
  ): Promise<HttpException> {
    const failureKey = this.getFailureKey(passportKey);
    const failures = await this.redisService.incr(
      failureKey,
      OCR_FAILURE_WINDOW_SECONDS,
    );

    if (failures >= OCR_FAILURE_LIMIT) {
      await this.redisService.set(
        this.getLockKey(passportKey),
        '1',
        OCR_LOCK_TIME_SECONDS,
      );
      await this.redisService.del(failureKey);
      return this.lockedError(OCR_LOCK_TIME_SECONDS);
    }

    return error;
  }

  private lockedError(retryAfter: number) {
    return new HttpException(
      {
        code: 'OCR_LOCKED',
        message: `Too many failed document checks. Try again in ${retryAfter} seconds.`,
        retryAfter,
      },
      HttpStatus.TOO_MANY_REQUESTS,
    );
  }

  private notRecognizedError() {
    return new HttpException(
      {
        code: 'DOCUMENT_NOT_RECOGNIZED',
        message:
          'The uploaded image does not appear to be a readable passport. Please upload a clearer photo of the passport page.',
      },
      HttpStatus.UNPROCESSABLE_ENTITY,
    );
  }

  private mismatchError(fields: MatchableField[]) {
    return new HttpException(
      {
        code: 'MISMATCH',
        message:
          'The passport details do not match the information you entered.',
        fields,
      },
      HttpStatus.UNPROCESSABLE_ENTITY,
    );
  }
}
