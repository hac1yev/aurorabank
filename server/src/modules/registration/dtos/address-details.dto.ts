import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsPostalCode,
  IsString,
  Length,
  MaxLength,
  MinLength,
} from 'class-validator';

export class AddressDetailsDto {
  @ApiProperty({
    example: '123 Main St',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  @MinLength(2)
  address!: string;

  @ApiProperty({
    example: 'New York',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  @MinLength(2)
  city!: string;

  @ApiProperty({
    example: 'NY',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  @MinLength(2)
  country!: string;

  @ApiProperty({
    example: '1234',
  })
  @IsString()
  @IsNotEmpty()
  @IsPostalCode('any')
  @Length(4, 4)
  postalCode!: string;
}
