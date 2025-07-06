import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { UserDocument } from 'src/schemas/user.schema';
import { MessageDocument } from 'src/schemas/message.schema';
import { ChatDocument } from 'src/schemas/chat.schema';

@Injectable()
export class ChatService {
  constructor(
    @InjectModel('User') public userModel: Model<UserDocument>,
    @InjectModel('Chat') private chatModel: Model<ChatDocument>,
    @InjectModel('Message') private messageModel: Model<MessageDocument>,
  ) {}

  async joinUser(username: string, socketId: string): Promise<UserDocument> {
    let user = await this.userModel.findOne({ username });
    if (!user) {
      user = await this.userModel.create({ username, socketId });
    } else {
      user.socketId = socketId;
      await user.save();
    }
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

  async getChatMessages(chatId: string) {
    return await this.messageModel.find({ chat: chatId }).populate('sender');
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
}
