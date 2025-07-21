import { IsNotEmpty, IsString } from 'class-validator';

export class CreateFigureDto {
  @IsNotEmpty()
  @IsString()
  childId: string;
}