import { IsString, IsInt, IsOptional, IsUrl } from 'class-validator';

export class CreateArticleDto {
  @IsString()
  title: string;

  @IsString()
  slug: string;

  @IsString()
  category: string;

  @IsString()
  author: string;

  @IsUrl()
  thumbnailUrl: string;

  @IsString()
  description: string;

  @IsString()
  symptoms: string;

  @IsString()
  causes: string;

  @IsString()
  treatment: string;

  @IsString()
  prevention: string;

  @IsString()
  conclusion: string;

  @IsOptional()
  @IsInt()
  diseaseId?: number;
}