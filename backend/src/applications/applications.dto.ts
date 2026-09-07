import { ApplicationStage } from '@prisma/client';
import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';

export class ApplyDto {
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  coverNote?: string;
}

// Employers use this to move someone along, to write back to them, or both.
// Every field is optional, so the stage dropdown and the message box can each
// send just the part they changed.
export class UpdateApplicationDto {
  @IsOptional()
  @IsEnum(ApplicationStage)
  stage?: ApplicationStage;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  employerMessage?: string;
}
