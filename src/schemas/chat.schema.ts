import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document, Types } from "mongoose";


@Schema()
export class ChatMongo
{
  @Prop({ type: Boolean, default: false })
  isGroup: boolean;

  @Prop({ type: [Types.ObjectId], ref: 'User' })
  members: Types.ObjectId[];

  @Prop({ type: String })
  name?: string;

  @Prop({ type: Date, default: Date.now })
  createdAt: Date; 
}

export const ChatSchema = SchemaFactory.createForClass(ChatMongo);
export type ChatDocument = ChatMongo & Document;
