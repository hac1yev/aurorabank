import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, Matches } from 'class-validator';

export class OtpDto {
  @IsNotEmpty()
  @IsString()
  @ApiProperty({
    example: '123456',
    description:
      'Otp code in numeric format. Must contain exactly 6 digits with no spaces or special characters.',
  })
  @Matches(/^[0-9]{6}$/, {
    message: 'Otp code must contain exactly 6 digits',
  })
  otp!: string;
}
