import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class DeleteRegistrationSessionDto {
  @ApiProperty({
    description: 'Registration token to delete the session for',
    example: '3f8a32b6-9b43-4f6c-b7ce-ccbd81c7362e',
  })
  @IsString()
  @IsNotEmpty()
  registrationToken!: string;
}
