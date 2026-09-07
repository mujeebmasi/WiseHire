import { JobType, VerificationLevel, WorkMode } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';

export class CreateJobDto {
  @IsString()
  @MinLength(3)
  title: string;

  @IsString()
  @MinLength(20, { message: 'Please write a longer description' })
  description: string;

  // IsEnum checks the value is one of the options in the Prisma enum,
  // which also means we get the right type without any casting.
  @IsEnum(JobType)
  type: JobType;

  @IsOptional()
  @IsEnum(WorkMode)
  workMode?: WorkMode;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  skills?: string[];

  // Which verification level someone needs before they can apply.
  @IsOptional()
  @IsEnum(VerificationLevel)
  minVerification?: VerificationLevel;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  salaryMin?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  salaryMax?: number;
}

// Filters arrive in the query string, so they are all optional.
export class JobFilterDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsEnum(JobType)
  type?: JobType;

  @IsOptional()
  @IsEnum(WorkMode)
  workMode?: WorkMode;
}
