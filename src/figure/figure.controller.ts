import {
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
  Body,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { FigureService } from './figure.service';
import { CreateFigureDto } from './dto/create-figure.dto';
import * as path from 'path';
import { analyzeImage } from './analyze-image';

@Controller('figures')
export class FigureController {
  constructor(private readonly figureService: FigureService) {}

  @Post()
@UseInterceptors(
  FileInterceptor('image', {
    storage: diskStorage({
      destination: './uploads',
      filename: (req, file, cb) => {
        const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
        const ext = path.extname(file.originalname);
        cb(null, `${unique}${ext}`);
      },
    }),
  }),
)
async create(
  @UploadedFile() file: Express.Multer.File,
  @Body() dto: CreateFigureDto,
) {
  return this.figureService.create(dto, file); 
}
}