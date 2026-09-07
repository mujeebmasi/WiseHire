import { UserRole } from '@prisma/client';
import { IsEmail, IsEnum, IsString, Matches, MinLength } from 'class-validator';

export class RegisterDto {
  @IsEmail({}, { message: 'Enter a valid email address' })
  email: string;

  @MinLength(8, { message: 'Password must be at least 8 characters' })
  password: string;

  @IsString()
  @MinLength(2)
  name: string;

  @IsEnum(UserRole)
  role: UserRole;
}

export class LoginDto {
  @IsEmail()
  email: string;

  @IsString()
  password: string;
}

// Pretend Aadhaar check. Real verification needs a licensed government
// API partner, so this stands in for it. The OTP is always 123456.
export class VerifyDto {
  @Matches(/^\d{12}$/, { message: 'Aadhaar number must be 12 digits' })
  aadhaarNumber: string;

  @Matches(/^\d{6}$/, { message: 'OTP must be 6 digits' })
  otp: string;
}
