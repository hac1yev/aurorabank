import { ApiProperty } from '@nestjs/swagger';
import { UploadedFileLike } from '../types/files.types';

export class RegistrationFilesDto {
  @ApiProperty({
    type: 'string',
    format: 'binary',
    isArray: true,
    description: 'Attach 1 or 2 files',
  })
  files!: UploadedFileLike[];
}
