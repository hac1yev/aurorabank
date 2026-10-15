import {
  Body,
  Controller,
  Headers,
  HttpCode,
  Post,
  UploadedFile,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { PersonalDetailsDto } from './dtos/personal-details.dto';
import { RegistrationService } from './registration.service';
import type { UploadedFileLike } from './types/files.types';
import {
  ApiBadRequestResponse,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiPayloadTooLargeResponse,
  ApiResponse,
  ApiUnauthorizedResponse,
  ApiUnsupportedMediaTypeResponse,
} from '@nestjs/swagger';
import { RegistrationFilesDto } from './dtos/personal-details-request-swagger.dto';
import { RegistrationStepOneResponseDto } from './dtos/personal-details-response';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { UploadValidationPipe } from 'src/shared/pipes/uploadValidation.pipe';
import { ContactDetailsResponseDto } from './dtos/contact-details-response';
import { ContactDetailsDto } from './dtos/contact-details.dto';
import { OtpDto } from './dtos/otp.dto';
import { AddressDetailsDto } from './dtos/address-details.dto';
import { FaceRecognitionDto } from './dtos/face-recognation.dto';

@Controller('registration')
export class RegistrationController {
  constructor(private registrationService: RegistrationService) {}

  @Post('/personal-details')
  @ApiOperation({
    summary:
      'Registration Step 1 - Personal details, consent, and document upload',
    description:
      'Validates files, stores personal details + consent in Redis, and returns registration token.',
  })
  @ApiConsumes('application/json')
  @ApiBody({
    type: PersonalDetailsDto,
  })
  @ApiResponse({
    status: 200,
    description:
      'Personal details and consent stored successfully in Redis. Registration token returned.',
    type: RegistrationStepOneResponseDto,
  })
  @HttpCode(200)
  handleStepOne(@Body() body: PersonalDetailsDto) {
    return this.registrationService.handlePersonalDetailsStep(body);
  }

  @Post('/contact-details')
  @ApiOperation({
    summary: 'Registration Step 2 - Store contact details in Redis',
    description:
      'Stores email and phone number in the registration session in Redis for later steps.',
  })
  @ApiResponse({
    status: 200,
    description: 'Contact details stored successfully in Redis.',
    type: ContactDetailsResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Invalid registration token or missing contact details.',
  })
  @HttpCode(200)
  handleContactDetails(
    @Body() body: ContactDetailsDto,
    @Headers('x-registration-token') registrationToken: string,
  ) {
    return this.registrationService.handleContactDetails(
      body,
      registrationToken,
    );
  }

  @Post('/verify-otp')
  @ApiOperation({
    summary: 'Verify OTP sent to user email',
    description:
      'Validates OTP input, tracks attempts, blocks if necessary, and updates registration session',
  })
  @ApiResponse({
    status: 200,
    description: 'OTP is valid, email verified successfully',
  })
  @ApiBadRequestResponse({
    description:
      'OTP is invalid, expired, or user is blocked due to too many attempts',
  })
  handleVerifyOtp(
    @Body() body: OtpDto,
    @Headers('x-registration-token') registrationToken: string,
  ) {
    return this.registrationService.validateEmailOtp(body, registrationToken);
  }

  @Post('/resend-otp')
  @ApiOperation({
    summary: 'Resend OTP to user email',
    description:
      'Generates a new OTP, sends it to the user email, and updates the registration session',
  })
  @ApiResponse({
    status: 200,
    description: 'New OTP sent successfully to user email',
  })
  @ApiBadRequestResponse({
    description:
      'User is blocked due to too many attempts or registration session not found',
  })
  handleResendOtp(@Headers('x-registration-token') registrationToken: string) {
    return this.registrationService.resendOtp(registrationToken);
  }

  @Post('/address-details')
  @ApiOperation({
    summary: 'Registration Step 3 - Store address details in Redis',
    description:
      'Stores address details in the registration session in Redis for later steps.',
  })
  @ApiBody({
    type: AddressDetailsDto,
  })
  @ApiResponse({
    status: 200,
    description: 'Address details stored successfully in Redis.',
  })
  @ApiBadRequestResponse({
    description: 'Invalid registration token or missing address details.',
  })
  handleAddressDetails(
    @Body() body: AddressDetailsDto,
    @Headers('x-registration-token') registrationToken: string,
  ) {
    return this.registrationService.handleAddressDetails(
      body,
      registrationToken,
    );
  }

  @Post('/ocr')
  @ApiOperation({
    summary: 'Extract passport information using OCR',
    description:
      'Uploads files and extracts passport information using OCR technology.',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    type: RegistrationFilesDto,
  })
  @ApiPayloadTooLargeResponse({
    description: 'This file is too large. The maximum size allowed is 10MB',
  })
  @ApiUnsupportedMediaTypeResponse({
    description:
      'This file type isn’t supported. Please upload a JPG, JPEG, PNG file.',
  })
  @ApiBadRequestResponse({
    description:
      'The selected file is empty. Please choose another file and try again. / The file name contains invalid characters. Please rename the file and try again. / You can upload up to 2 files at once.',
  })
  @ApiResponse({
    status: 200,
    description:
      'Files passed validation. Registration data stored successfully in Redis.',
  })
  @UseInterceptors(FilesInterceptor('files', 2))
  handlePassportOcr(
    @UploadedFiles(new UploadValidationPipe()) files: UploadedFileLike[],
    @Headers('x-registration-token') registrationToken: string,
  ) {
    return this.registrationService.getPassportInfoFromOcr(
      registrationToken,
      files,
    );
  }

  @Post('face-recognation')
  @ApiOperation({
    summary: 'Verify user identity using facial recognition',
    description:
      'Uploads a selfie and compares the detected face with the portrait extracted from the previously uploaded passport.',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    type: FaceRecognitionDto,
  })
  @ApiPayloadTooLargeResponse({
    description: 'This file is too large. The maximum size allowed is 10MB.',
  })
  @ApiUnsupportedMediaTypeResponse({
    description:
      'This file type is not supported. Please upload a JPG, JPEG, or PNG file.',
  })
  @ApiBadRequestResponse({
    description:
      'The uploaded file is empty or invalid, the face could not be detected, or the registration token is missing or invalid.',
  })
  @ApiUnauthorizedResponse({
    description: 'The registration session is invalid or has expired.',
  })
  @ApiResponse({
    status: 200,
    description: 'Facial verification completed successfully.',
  })
  @UseInterceptors(FileInterceptor('image'))
  handleFaceRecognation(
    @UploadedFile(new UploadValidationPipe()) file: UploadedFileLike,
    @Headers('x-registration-token') registrationToken: string,
  ) {
    return this.registrationService.verifyFaceRecognition(
      registrationToken,
      file,
    );
  }
}
