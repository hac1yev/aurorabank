import { ApiProperty } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsString,
  IsDate,
  IsNotEmpty,
  Length,
  IsBoolean,
  Equals,
} from 'class-validator';
import { IsValidDate } from 'src/shared/validators/isValidDate.validator';

export class PersonalDetailsDto {
  @ApiProperty({
    example: 'Ilkin',
  })
  @IsNotEmpty()
  @IsString()
  @Length(3, 35)
  firstName!: string;

  @ApiProperty({
    example: 'Haciyev',
  })
  @IsNotEmpty()
  @IsString()
  @Length(3, 35)
  lastName!: string;

  @ApiProperty({
    example: '1990-01-01',
  })
  @IsNotEmpty()
  @Type(() => Date)
  @IsDate()
  @IsValidDate({ message: 'You must be at least 15 years old' })
  birthDate!: Date;

  @ApiProperty({
    example: 'Azerbaijan',
  })
  @IsNotEmpty()
  @IsString()
  citizenship!: string;

  @ApiProperty({
    example: '123456789012',
  })
  @IsNotEmpty()
  @IsString()
  passportNumber!: string;

  @ApiProperty({
    example: true,
  })
  @IsNotEmpty()
  @Transform(({ value }) => {
    if (typeof value === 'boolean') {
      return value;
    }
    if (typeof value === 'string') {
      return value === 'true' || value === '1';
    }
    return false;
  })
  @IsBoolean()
  @Equals(true)
  consent!: boolean;
}
