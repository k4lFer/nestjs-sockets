import { Schema, Prop, SchemaFactory } from "@nestjs/mongoose";
import { Document, Types } from "mongoose";

@Schema()
export class MessageMongo {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  sender: string;

  @Prop({ type: String, required: false })
  content: string;

  @Prop({ type: Types.ObjectId, ref: 'Chat', required: true })
  chat: string;

  @Prop({ type: Date, default: Date.now })
  timestamp: Date;

  @Prop({ type: String, enum: ['sent', 'seen'], default: 'sent' })
  status: 'sent' | 'seen';

  @Prop({
    type: {
      filename: String,
      mimetype: String,
      size: Number,
      storageType: String, // 'buffer' o 'gridfs'
      fileId: Types.ObjectId, // si es GridFS
      data: Buffer, // si es buffer
    },
    default: null,
  })
  file?: {
    filename: string;
    mimetype: string;
    size: number;
    storageType: 'buffer' | 'gridfs';
    fileId?: Types.ObjectId;
    data?: Buffer;
  };

}

export const MessageSchema = SchemaFactory.createForClass(MessageMongo);
export type MessageDocument = MessageMongo & Document;

