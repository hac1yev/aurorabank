import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class ContactDetailsResponseDto {
  @ApiProperty({
    description: 'Status of the operation',
    example: 'ok',
  })
  @IsString()
  status!: string;
}
