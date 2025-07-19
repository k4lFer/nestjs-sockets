import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document, Types } from "mongoose";

@Schema()
export class UserMongo {
  @Prop({ required: true }) username: string;
  @Prop({ required: true }) password: string;
  @Prop() socketId?: string; 

  @Prop({ type: [Types.ObjectId], ref: 'User', default: [] })
  friends: Types.ObjectId[];

  @Prop({ type: [Types.ObjectId], ref: 'User', default: [] })
  pendingRequests: Types.ObjectId[];

  @Prop({ type: [Types.ObjectId], ref: 'User', default: [] })
  sentRequests: Types.ObjectId[];
}

export const UserSchema = SchemaFactory.createForClass(UserMongo);
export type UserDocument = UserMongo & Document;