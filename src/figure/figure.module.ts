import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { FigureService } from './figure.service';
import { FigureController } from './figure.controller';
import { Figure, FigureSchema } from './schemas/figure.schema';

@Module({
  imports: [MongooseModule.forFeature([{ name: Figure.name, schema: FigureSchema }])],
  controllers: [FigureController],
  providers: [FigureService],
})
export class FigureModule {}