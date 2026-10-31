import { IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';
import { Match } from 'src/shared/decorators/match';

export class ConfirmPasswordDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  @MinLength(8)
  password!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  @MinLength(8)
  @Match('password', {
    message: 'Password do not math',
  })
  confirmPassword!: string;
}
