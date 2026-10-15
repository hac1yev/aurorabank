import { ApiProperty } from '@nestjs/swagger';

export class CompleteRegistrationResponseDto {
  @ApiProperty({
    description: 'Operation status',
    example: 'completed',
  })
  status!: string;
}
