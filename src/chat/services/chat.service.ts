import { Injectable } from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { Connection, Model, Types } from 'mongoose';
import { UserDocument } from 'src/chat/schemas/user.schema';
import { MessageDocument } from 'src/chat/schemas/message.schema';
import { ChatDocument } from 'src/chat/schemas/chat.schema';
import { GridFSBucket } from 'mongodb';

@Injectable()
export class ChatService {
  private bucket: GridFSBucket;
  constructor(
    @InjectModel('User') public userModel: Model<UserDocument>,
    @InjectModel('Chat') private chatModel: Model<ChatDocument>,
    @InjectModel('Message') private messageModel: Model<MessageDocument>,
    @InjectConnection() private connection: Connection,
  ) {
      this.bucket = new GridFSBucket(this.connection.db!, { bucketName: 'uploads' });
  }

async joinUserById(userId: string, socketId: string): Promise<UserDocument> {
  const user = await this.userModel.findById(userId);
  if (!user) throw new Error('Usuario no encontrado');
  user.socketId = socketId;
  await user.save();
  return user;
}

  async getUserBy(search: string): Promise<UserDocument | null> {
    return await this.userModel.findOne({
      $or: [
        { username: new RegExp(search, 'i') },
        { _id: new Types.ObjectId(search) },
      ],
    });
  }

  async getOrCreatePrivateChat(userAId: string, userBId: string) {
    const existing = await this.chatModel.findOne({
      isGroup: false,
      members: { $all: [userAId, userBId], $size: 2 },
    });
    if (existing) return existing;

    return await this.chatModel.create({
      isGroup: false,
      members: [userAId, userBId],
    });
  }

  async createGroup(name: string, memberIds: string[]) {
    return await this.chatModel.create({
      isGroup: true,
      name,
      members: memberIds,
    });
  }

  async getUserChats(userId: string) {
    return await this.chatModel.find({ members: userId }).populate('members');
  }

  async getUserGroups(userId: string) {
    return await this.chatModel.find({ isGroup: true, members: userId }).populate('members');
  }

  async searchUserGroups(userId: string, search: string) {
    return await this.chatModel.find({
      isGroup: true,
      members: userId,
      name: { $regex: search, $options: 'i' }, 
    }).populate('members');
  }


  async getChatMessages(chatId: string) {
    return await this.messageModel.find({ chat: chatId }).populate('sender');
  }

  async getMessageById(messageId: string) {
    return this.messageModel.findById(messageId);
  }
  async getFileStreamFromGridFS(fileId: Types.ObjectId | string) {
    return await this.bucket.openDownloadStream(
      typeof fileId === 'string' ? new Types.ObjectId(fileId) : fileId,
    );
  }

  async getConnectedUsers(): Promise<UserDocument[]> {
    return await this.userModel.find({ socketId: { $ne: null } });
  }

  async disconnectUser(socketId: string): Promise<void> {
    await this.userModel.updateOne({ socketId }, { $unset: { socketId: "" } });
  }

  async saveMessage(senderId: string, chatId: string, content: string) {
    const msg = await this.messageModel.create({
      sender: senderId,
      chat: chatId,
      content: content.trim(),
    });
    return await msg.populate('sender');
  }

  private async processFile(
    file: Buffer,
    originalName: string,
    mimetype: string
  ): Promise<{
    filename: string;
    mimetype: string;
    size: number;
    storageType: 'gridfs' | 'buffer';
    fileId?: Types.ObjectId;
    data?: Buffer;
  }> {
    const storageType = file.length > 16 * 1024 * 1024 ? 'gridfs' : 'buffer';

    const fileMetadata: any = {
      filename: originalName,
      mimetype,
      size: file.length,
      storageType,
    };

    if (storageType === 'gridfs') {
      const uploadStream = this.bucket.openUploadStream(originalName, {
        contentType: mimetype,
      });
      uploadStream.end(file);
      await new Promise((res, rej) =>
        uploadStream.on('finish', res).on('error', rej),
      );
      fileMetadata.fileId = uploadStream.id;
    } else {
      fileMetadata.data = file;
    }

    return fileMetadata;
  }

  async createMessageFromBuffer(
    senderId: string,
    chatId: string,
    content: string,
    file: Express.Multer.File,
  ) {
    const fileMetadata = await this.processFile(file.buffer, file.originalname, file.mimetype);

    const msg = await this.messageModel.create({
      sender: senderId,
      chat: chatId,
      content: content?.trim() || '',
      file: fileMetadata,
    });

    return await msg.populate('sender');
  }
  
}
