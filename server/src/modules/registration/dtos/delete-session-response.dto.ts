import { ApiProperty } from '@nestjs/swagger';

export class DeleteRegistrationSessionResponseDto {
  @ApiProperty({
    description: 'Operation status',
    example: 'deleted',
  })
  status!: string;
}
