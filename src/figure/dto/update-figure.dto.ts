import { PartialType } from '@nestjs/mapped-types';
import { CreateFigureDto } from './create-figure.dto';

export class UpdateFigureDto extends PartialType(CreateFigureDto) {}
