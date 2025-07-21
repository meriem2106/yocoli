import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, SchemaTypes, Types } from 'mongoose';

@Schema()
export class User extends Document {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ required: true })
  password: string;

  @Prop({ default: false })               
  isEmailVerified: boolean;

  
  @Prop()                                
  emailVerificationToken?: string;

  @Prop({ type: [Types.ObjectId], ref: 'ChildProfile', default: [] })
children: Types.ObjectId[];
}

export const UserSchema = SchemaFactory.createForClass(User);
