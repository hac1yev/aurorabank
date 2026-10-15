import { ApiProperty } from '@nestjs/swagger';

export class FaceRecognitionDto {
  @ApiProperty({
    type: 'string',
    format: 'binary',
    description: 'Selfie image for facial recognition (JPG, JPEG, or PNG).',
  })
  image: any;
}
