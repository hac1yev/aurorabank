import { Module } from '@nestjs/common';
import { RegistrationService } from './registration.service';
import { RegistrationController } from './registration.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './user.entity';
import { RedisModule } from 'src/shared/modules/redis/redis.module';
import { ConsentService } from './consent.service';
import { AesGcmProvider } from 'src/shared/providers/aes-gcm.provider';
import { OtpService } from './otp.service';
import { MailModule } from 'src/shared/modules/mail/mail.module';
import { OcrService } from './ocr.service';
import { CloudinaryModule } from '../cloudinary/cloudinary.module';
import { AiModule } from '../ai/ai.module';
import { FaceRecognationService } from './face-recognation.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
    RedisModule,
    MailModule,
    CloudinaryModule,
    AiModule,
  ],
  providers: [
    RegistrationService,
    ConsentService,
    AesGcmProvider,
    OtpService,
    OcrService,
    FaceRecognationService,
  ],
  controllers: [RegistrationController],
})
export class RegistrationModule {}
