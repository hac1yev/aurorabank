import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CompleteRegistrationDto {
  @ApiProperty({
    description: 'Registration token received from step 1',
    example: '3f8a32b6-9b43-4f6c-b7ce-ccbd81c7362e',
  })
  @IsString()
  @IsNotEmpty()
  registrationToken!: string;
}
