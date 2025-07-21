import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, SchemaTypes, Types } from 'mongoose';

@Schema({ timestamps: true })
export class Figure extends Document {
  @Prop({ required: true })
  label: string;

  @Prop([String])
  colors: string[];

  @Prop({ required: true })
  imageUrl: string; // Le chemin vers l’image stockée

  @Prop({ type: SchemaTypes.ObjectId, ref: 'ChildProfile', required: true })
  child: Types.ObjectId;
}

export const FigureSchema = SchemaFactory.createForClass(Figure);