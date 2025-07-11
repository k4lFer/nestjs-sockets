import {
  ConnectedSocket,
  MessageBody,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ChatService } from './chat.service';
import { Injectable } from '@nestjs/common';

@WebSocketGateway({ cors: true })
@Injectable()
export class ServerGateway implements OnGatewayDisconnect {
  constructor(private readonly chatService: ChatService) { }

  @WebSocketServer()
  server: Server;

  @SubscribeMessage('join')
  async handleJoin(@ConnectedSocket() client: Socket, @MessageBody() userId: string) {
    const user = await this.chatService.joinUserById(userId, client.id);

    client.emit('welcome', {
      message: `Bienvenido ${user.username}!`,
      userId: user._id,
    });

    const connectedUsers = await this.chatService.getConnectedUsers();
    this.server.emit('connected-users', connectedUsers.map(u => ({
      id: u._id,
      username: u.username,
    })));

    console.log(`Usuario ${user.username} conectado con ID: ${user._id}`);
  }


  @SubscribeMessage('send-message')
  async handleMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { chatId: string; senderId: string; message: string }
  ) {
    if (!data.message.trim()) return;
    const populated = await this.chatService.saveMessage(data.senderId, data.chatId, data.message);
    this.server.to(data.chatId).emit('new-message', populated);
    console.log(`Mensaje enviado por ${data.senderId}: ${data.message}`);
    console.log(`Enviado a chat ${data.chatId}`);
    console.log(`Mensaje enviado por ${populated.sender}: ${populated.content}`);

  }

  @SubscribeMessage('join-chat')
  async joinChat(@ConnectedSocket() client: Socket, @MessageBody() chatId: string) {
    client.join(chatId);
    const messages = await this.chatService.getChatMessages(chatId);
    client.emit('chat-history', messages);
  }

  @SubscribeMessage('get-chats')
  async handleGetChats(@ConnectedSocket() client: Socket, @MessageBody() userId: string) {
    const user = await this.chatService.getUserBy(userId);
    if (!user) {
      client.emit('error', 'Usuario inválido');
      return;
    }

    const chats = await this.chatService.getUserChats(userId);
    client.emit('user-chats', chats);
  }


  @SubscribeMessage('create-group')
  async handleCreateGroup(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { name: string; memberIds: string[] }
  ) {
    const group = await this.chatService.createGroup(data.name, data.memberIds);
    client.emit('group-created', group);
  }

  @SubscribeMessage('private-chat')
  async handlePrivateChat(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { userAId: string; userBId: string }
  ) {
    const chat = await this.chatService.getOrCreatePrivateChat(data.userAId, data.userBId);
    const userB = await this.chatService.getUserBy(data.userBId);

    client.emit('private-chat-created', chat);
    client.join((chat._id as string).toString());

    if (userB?.socketId) {
      this.server.to(userB.socketId).emit('private-chat-created', chat);
      // También unir al otro usuario a la sala
      this.server.sockets.sockets.get(userB.socketId)?.join((chat._id as string).toString());
    }
  }

  @SubscribeMessage('get-connected-users')
  async handleGetConnectedUsers(@ConnectedSocket() client: Socket) {
    const connectedUsers = await this.chatService.getConnectedUsers();
    client.emit('connected-users', connectedUsers.map(u => ({ id: u._id, username: u.username })));
  }

  async handleDisconnect(client: Socket) {
    await this.chatService.disconnectUser(client.id);
    const connectedUsers = await this.chatService.getConnectedUsers();
    this.server.emit('connected-users', connectedUsers.map(u => ({ id: u._id, username: u.username })));
  }
}
