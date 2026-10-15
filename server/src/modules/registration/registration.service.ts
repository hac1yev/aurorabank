import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './user.entity';
import { PersonalDetailsDto } from './dtos/personal-details.dto';
import { UploadedFileLike } from './types/files.types';
import { OcrService } from './ocr.service';
import { v4 as uuidv4 } from 'uuid';
import { ConsentService } from './consent.service';
import { RegistrationStepOneResponseDto } from './dtos/personal-details-response';
import { ContactDetailsDto } from './dtos/contact-details.dto';
import { OtpService } from './otp.service';
import { MailService } from 'src/shared/modules/mail/mail.service';
import { OtpDto } from './dtos/otp.dto';
import { RegistrationSession } from './types/registration-session.interface';
import { AddressDetailsDto } from './dtos/address-details.dto';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { FaceRecognationService } from './face-recognation.service';

@Injectable()
export class RegistrationService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private ocrService: OcrService,
    private consentService: ConsentService,
    private otpService: OtpService,
    private mailService: MailService,
    private cloudinaryService: CloudinaryService,
    private faceRecognationService: FaceRecognationService,
  ) {}

  async handlePersonalDetailsStep(
    personalDetails: PersonalDetailsDto,
  ): Promise<RegistrationStepOneResponseDto> {
    const registrationToken = uuidv4();
    const consentTimestamp = new Date().toISOString();

    await this.consentService.storeConsent(
      registrationToken,
      consentTimestamp,
      personalDetails,
    );

    return { status: 'ok', registrationToken };
  }

  async handleContactDetails(
    contactDetails: ContactDetailsDto,
    registrationToken: string,
  ) {
    await this.consentService.storeContactDetails(
      registrationToken,
      contactDetails,
    );

    const { otp } = await this.otpService.saveEmailOtp(registrationToken);
    await this.mailService.sendOtpEmail(contactDetails.email, otp, {
      operation: 'E-mail Confirmation',
    });

    return { success: true, registrationToken };
  }

  async validateEmailOtp(body: OtpDto, registrationToken: string) {
    const isValid = await this.otpService.validateOtp(
      body.otp,
      registrationToken,
    );

    return isValid;
  }

  async resendOtp(registrationToken: string) {
    const { otp } = await this.otpService.resendOtp(registrationToken);
    const session =
      await this.consentService.getConsentFromRedis<RegistrationSession>(
        registrationToken,
      );

    if (!session || !session.contacts || !session.contacts.email) {
      throw new InternalServerErrorException(
        'Registration session not found or missing contact details',
      );
    }
    await this.mailService.sendOtpEmail(session.contacts.email, otp, {
      operation: 'Resend E-mail Confirmation',
    });
    return { otp };
  }

  async handleAddressDetails(
    body: AddressDetailsDto,
    registrationToken: string,
  ) {
    await this.consentService.storeAddressDetails(registrationToken, body);

    return { success: true, registrationToken };
  }

  async getPassportInfoFromOcr(
    registrationToken: string,
    files: UploadedFileLike[],
  ) {
    try {
      const res = await this.ocrService.extractPassport(
        registrationToken,
        files,
      );

      return res;
    } catch (error) {
      throw new InternalServerErrorException(
        error,
        'Failed to extract passport information from OCR',
      );
    }
  }

  async verifyFaceRecognition(
    registrationToken: string,
    file: UploadedFileLike,
  ) {
    const session =
      await this.consentService.getConsentFromRedis<RegistrationSession>(
        registrationToken,
      );

    if (!session) {
      throw new NotFoundException('Session expired');
    }

    const publicId = session.public_id;

    if (!publicId) {
      throw new BadRequestException(
        'Passport image not found. Please upload your passport again.',
      );
    }

    const passportBuffer = await this.cloudinaryService.downloadImage(publicId);

    if (file.buffer) {
      const result = await this.faceRecognationService.compareFaces(
        passportBuffer,
        file.buffer,
      );

      if (!result.matched) {
        throw new BadRequestException({
          success: false,
          message:
            'Face verification failed. The selfie does not match the passport photo.',
          matched: false,
          distance: result.distance,
        });
      }

      return {
        success: true,
        matched: true,
        distance: result.distance,
      };
    }

    throw new BadRequestException('Selfie image buffer is missing');
  }
}
