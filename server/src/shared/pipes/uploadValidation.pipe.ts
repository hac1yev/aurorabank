import {
  BadRequestException,
  HttpStatus,
  Injectable,
  ParseFilePipeBuilder,
  PayloadTooLargeException,
  PipeTransform,
  UnsupportedMediaTypeException,
} from '@nestjs/common';
import {
  ALLOWED_EXTENSION,
  ALLOWED_MIME_TYPES,
  FILENAME_ALLOWED_REGEX,
  MAX_FILE_SIZE_BYTES,
  MAX_FILE_UPLOADS,
} from '../constants/files.constants';
import { formatAllowedTypes, formatMaxSize } from 'src/utils';

@Injectable()
export class UploadValidationPipe implements PipeTransform {
  private readonly requiredFilePipe = new ParseFilePipeBuilder().build({
    fileIsRequired: true,
    errorHttpStatusCode: HttpStatus.BAD_REQUEST,
  });

  async transform(fileOrFiles: Express.Multer.File | Express.Multer.File[]) {
    // Handle multiple file uploads (array of files)
    if (Array.isArray(fileOrFiles)) {
      const files = fileOrFiles;

      if (!files || files.length === 0) {
        throw new BadRequestException(
          'The selected file is empty. Please choose another file and try again.',
        );
      }

      if (files.length > MAX_FILE_UPLOADS) {
        throw new BadRequestException(
          `You can upload up to ${MAX_FILE_UPLOADS} files at once.`,
        );
      }

      files.forEach((file) => this.validateFile(file));
      return files;
    }

    // legacy approach for single file uploads, can be removed in the future if not needed
    const file = fileOrFiles;
    await this.requiredFilePipe.transform(file);
    this.validateFile(file);
    return file;
  }

  private validateFile(file: Express.Multer.File) {
    if (!file || (typeof file !== 'number' && file.size === 0)) {
      throw new BadRequestException(
        'The selected file is empty. Please choose another file and try again.',
      );
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      throw new PayloadTooLargeException(
        `This file is too large. The maximum size allowed is ${formatMaxSize(MAX_FILE_SIZE_BYTES)}.`,
      );
    }

    const originalName: string = file.originalname || '';
    const baseName = originalName.replace(/\.[^/.]+$/, ''); // Remove file extension
    if (!FILENAME_ALLOWED_REGEX.test(baseName)) {
      throw new BadRequestException(
        'The file name contains invalid characters. Please rename the file and try again.',
      );
    }

    const mimeOk = file.mimetype
      ? ALLOWED_MIME_TYPES.includes(file.mimetype)
      : false;
    const ext = originalName.includes('.')
      ? originalName.substring(originalName.lastIndexOf('.')).toLowerCase()
      : '';
    const extOk = ext
      ? ALLOWED_EXTENSION.some((type) => type.endsWith(ext))
      : false;

    if (!mimeOk || !extOk) {
      throw new UnsupportedMediaTypeException({
        message: `This file type isn’t supported. Please upload a ${formatAllowedTypes()} file.`,
      });
    }
  }
}
