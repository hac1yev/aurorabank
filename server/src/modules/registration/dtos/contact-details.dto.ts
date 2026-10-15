import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsNotEmpty, IsString, Length, Matches } from 'class-validator';
import { EMAIL_REGEX } from 'src/shared/constants/regex.constants';
import { trimAndCollapseSpaces } from 'src/shared/transformers/string.transformer';

export class ContactDetailsDto {
  @Transform(({ value }) => trimAndCollapseSpaces(value))
  @IsString()
  @IsNotEmpty()
  @Length(9, 16, {
    message: (args) => {
      const value = args.value as string;

      if (value.length < args.constraints[0]) {
        return 'Input shorter than 9 characters.';
      }
      if (value.length > args.constraints[1]) {
        return 'Input exceeds 16 characters.';
      }
      return 'The user input contains invalid characters.';
    },
  })
  @ApiProperty({
    example: '+123456789',
    description:
      'Phone number. Allowed characters: digits and optional leading plus (+). Length: 9–16.',
  })
  @Matches(/^\+[0-9]+$/, {
    message:
      'Phone number must start with a plus sign (+) and must contain digits only',
  })
  phone!: string;

  @Transform(({ value }) => trimAndCollapseSpaces(value))
  @IsString()
  @Length(5, 254, {
    message: (args) => {
      const value = args.value as string;

      if (value.length < 5) {
        return 'Input shorter than 5 characters.';
      }
      if (value.length > 254) {
        return 'Input exceeds 254 characters';
      }
      return 'The user input contains invalid characters.';
    },
  })
  @IsNotEmpty()
  @ApiProperty({
    example: 'ilkinhaciyev955@gmail.com',
    description:
      'User email address. Allowed characters: Latin letters, digits, dot (.), hyphen (-), underscore (_), plus (+). Must contain one "@" and at least one "." after it.',
  })
  @Matches(EMAIL_REGEX, {
    message: 'Invalid email format',
  })
  email!: string;
}
