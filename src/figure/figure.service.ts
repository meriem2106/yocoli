import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateFigureDto } from './dto/create-figure.dto';
import { exec } from 'child_process';
import * as path from 'path';
import * as fs from 'fs';
import { Figure } from './schemas/figure.schema';
import { analyzeImage } from './analyze-image';

@Injectable()
export class FigureService {
  constructor(
    @InjectModel(Figure.name)
    private readonly figureModel: Model<Figure>,
  ) {}

  async create(dto: CreateFigureDto, image: Express.Multer.File) {
    if (!image) {
      throw new BadRequestException("Image manquante.");
    }
  
    const imagePath = path.join(__dirname, '../../uploads', image.filename);
    const output = await analyzeImage(imagePath);
  
    const figure = new this.figureModel({
      label: output.label,
      colors: output.colors,
      imageUrl: image.filename,
      child: dto.childId,
    });
  
    return figure.save();
  }
}