import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";

@Schema()
export class UserMongo {
  @Prop({ required: true }) username: string;
  @Prop() socketId?: string; 
}

export const UserSchema = SchemaFactory.createForClass(UserMongo);
export type UserDocument = UserMongo & Document;