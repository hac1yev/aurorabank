import { Injectable } from '@nestjs/common';
import Tesseract, { RecognizeResult } from 'tesseract.js';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { UploadedFileLike } from './types/files.types';
import { AiService } from '../ai/ai.service';
import { ConsentService } from './consent.service';

@Injectable()
export class OcrService {
  constructor(
    private cloudinaryService: CloudinaryService,
    private aiService: AiService,
    private consentService: ConsentService,
  ) {}

  async extractPassport(registrationToken: string, files: UploadedFileLike[]) {
    const uploadedAsset = await this.cloudinaryService.uploadImage(files);
    const public_id = uploadedAsset?.public_id as string;

    await this.consentService.storeUploadedDocument(
      registrationToken,
      public_id,
    );

    const result: RecognizeResult = await Tesseract.recognize(
      files[0].buffer!,
      'eng',
    );

    const text: string = result.data.text;
    const res = await this.aiService.extractPassportInfo(text);
    return { ...res, public_id };
  }
}
