import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomInt } from 'crypto';
import {
  OTP_BLOCK_TIME_SECONDS,
  OTP_INPUT_LIMIT,
  OTP_INPUT_WINDOW_SECONDS,
  OTP_RESEND_LIMIT,
  OTP_TTL_SECONDS,
} from 'src/shared/constants/otp.constants';
import { RedisService } from 'src/shared/modules/redis/redis.service';
import { RegistrationSession } from './types/registration-session.interface';
import { ConsentService } from './consent.service';

@Injectable()
export class OtpService {
  constructor(
    private redisService: RedisService,
    private consentService: ConsentService,
  ) {}

  private getOtpKey(registrationToken: string) {
    return `otp:email:${registrationToken}`;
  }

  private getOtpAttemptKey(registrationToken: string): string {
    return `otp:attempts:${registrationToken}`;
  }

  private getOtpBlockKey(registrationToken: string): string {
    return `otp:block:${registrationToken}`;
  }

  private getOtpCooldownKey(registrationToken: string): string {
    return `otp:cooldown:${registrationToken}`;
  }

  private getResendCountKey(registrationToken: string): string {
    return `otp:resend:count:${registrationToken}`;
  }

  private getResendBlockKey(registrationToken: string): string {
    return `otp:resend:block:${registrationToken}`;
  }

  generateOtp(length = 6): string {
    const min = Math.pow(10, length - 1);
    const max = Math.pow(10, length) - 1;
    return randomInt(min, max + 1).toString();
  }

  async saveEmailOtp(registrationToken: string) {
    const otp = this.generateOtp(6);
    const key = this.getOtpKey(registrationToken);

    await this.redisService.set(key, otp, OTP_TTL_SECONDS);

    return { otp };
  }

  async validateOtp(otp: string, registrationToken: string) {
    // Retrieve the registration session from Redis using the registration token
    const session =
      await this.consentService.getConsentFromRedis<RegistrationSession>(
        registrationToken,
      );

    if (!session) {
      throw new NotFoundException('Registration session not found or expired');
    }

    // Ensure the user is not blocked due to too many failed attempts
    await this.ensureNotBlocked(registrationToken);

    // Retrieve the stored OTP from Redis
    const key = this.getOtpKey(registrationToken);
    const storedOtp = await this.redisService.get(key);

    // If the stored OTP is null, it means the OTP has expired or was never set
    if (!storedOtp) {
      await this.handleWrongOtp(registrationToken);
      throw new BadRequestException('Code expired. Request a new one.');
    }

    // If the provided OTP does not match the stored OTP, handle it as a wrong attempt
    if (storedOtp !== otp) {
      await this.handleWrongOtp(registrationToken);
      throw new HttpException('Invalid code.', 400);
    }

    // If the OTP is valid, clear the OTP and attempt counters from Redis
    await this.onSuccessfulVerification(registrationToken);

    return { success: true };
  }

  private async ensureNotBlocked(registrationToken: string) {
    const blockKey = this.getOtpBlockKey(registrationToken);
    const isBlocked = await this.redisService.get(blockKey);

    if (isBlocked) {
      const ttl = await this.redisService.ttl(blockKey);
      throw new HttpException(
        {
          code: '429',
          message: `Too many attempts. OTP input blocked for ${ttl} seconds.`,
          retryAfter: ttl,
        },
        429,
      );
    }
  }

  private async handleWrongOtp(registrationToken: string) {
    const attemptKey = this.getOtpAttemptKey(registrationToken);
    const blockKey = this.getOtpBlockKey(registrationToken);

    const attempts = await this.redisService.incr(attemptKey);

    if (attempts === 1) {
      await this.redisService.expire(attemptKey, OTP_INPUT_WINDOW_SECONDS);
    }

    if (attempts >= OTP_INPUT_LIMIT) {
      await this.redisService.set(blockKey, '1', OTP_BLOCK_TIME_SECONDS);
      await this.redisService.del(attemptKey);
      throw new HttpException(
        {
          code: '429',
          message: `Too many attempts. OTP input blocked for ${OTP_BLOCK_TIME_SECONDS} seconds.`,
          retryAfter: OTP_BLOCK_TIME_SECONDS,
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
  }

  private async onSuccessfulVerification(email: string) {
    await this.redisService.del(this.getOtpKey(email));
    await this.redisService.del(this.getOtpAttemptKey(email));
  }

  async resendOtp(registrationToken: string) {
    const resendCountKey = this.getResendCountKey(registrationToken);
    const resendBlockKey = this.getResendBlockKey(registrationToken);
    const resendCooldownKey = this.getOtpCooldownKey(registrationToken);

    const cooldown = await this.redisService.get(resendCooldownKey);
    const resendCount = await this.redisService.get(resendCountKey);

    if (cooldown) {
      const ttl = await this.redisService.ttl(resendCooldownKey);
      throw new HttpException(
        {
          code: '429',
          message: `Resend cooldown active. Please wait ${ttl} seconds before requesting a new OTP.`,
          retryAfter: ttl,
        },
        429,
      );
    }

    if (resendCount && parseInt(resendCount) >= OTP_RESEND_LIMIT) {
      await this.redisService.set(resendBlockKey, '1', OTP_BLOCK_TIME_SECONDS);
      await this.redisService.del(resendCountKey);
    }

    const isBlocked = await this.redisService.get(resendBlockKey);
    if (isBlocked) {
      const ttl = await this.redisService.ttl(resendBlockKey);
      throw new HttpException(
        {
          code: '429',
          message: `Too many resend attempts. Resend blocked for ${ttl} seconds.`,
          retryAfter: ttl,
        },
        429,
      );
    }

    const { otp } = await this.saveEmailOtp(registrationToken);
    await this.redisService.incr(resendCountKey);
    await this.redisService.expire(resendCountKey, OTP_INPUT_WINDOW_SECONDS);
    await this.redisService.set(resendCooldownKey, '1', 60);

    return { otp };
  }
}
