import { ApiProperty } from '@nestjs/swagger';

export class RegistrationStepOneResponseDto {
  @ApiProperty({ description: 'Operation status', example: 'ok' })
  status!: string;

  @ApiProperty({
    description: 'Registration token returned after step1',
    example: '0f8fad5b-d9cb-469f-a165-70867728950e',
  })
  registrationToken!: string;
}
