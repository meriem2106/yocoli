import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, SchemaTypes, Types } from 'mongoose';

@Schema({ timestamps: true })
export class ChildProfile extends Document {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  dateOfBirth: Date;

  @Prop()
  avatar: string;

  @Prop({ type: SchemaTypes.ObjectId, ref: 'User', required: true })
  parent: Types.ObjectId;
}

export const ChildProfileSchema = SchemaFactory.createForClass(ChildProfile);