import {
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateCompanyDto {
  @IsString()
  @MinLength(2, { message: 'Company name is too short' })
  @MaxLength(100)
  name: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @IsOptional()
  @IsUrl(
    {},
    { message: 'Website must be a full address, like https://example.com' },
  )
  website?: string;
}
