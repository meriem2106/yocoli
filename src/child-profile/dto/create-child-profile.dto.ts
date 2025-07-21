import {
    IsNotEmpty,
    IsOptional,
    IsString,
    Matches,
  } from 'class-validator';
  
  export class CreateChildDto {
    @IsString()
    @IsNotEmpty()
    name: string;
  
    // DD-MM-YYYY
    @Matches(/^\d{2}-\d{2}-\d{4}$/, {
      message: 'La date de naissance doit être au format DD-MM-YYYY',
    })
    dateOfBirth: string;
  
    @IsOptional()
    @IsString()
    avatar?: string;
  }