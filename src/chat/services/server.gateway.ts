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
import { UserService } from 'src/user/user.service';

@WebSocketGateway({ cors: true })
@Injectable()
export class ServerGateway implements OnGatewayDisconnect {
  constructor(
    private readonly chatService: ChatService,
    private readonly userService: UserService
  ) { }

  @WebSocketServer()
  server: Server;

  @SubscribeMessage('join')
  async handleJoin(@ConnectedSocket() client: Socket, @MessageBody() userId: string) {
    const user = await this.chatService.joinUserById(userId, client.id);

    client.emit('welcome', {
     // message: `Bienvenido ${user.username}!`,
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

/*
  @SubscribeMessage('create-group')
  async handleCreateGroup(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { name: string; memberIds: string[] }
  ) {
    const group = await this.chatService.createGroup(data.name, data.memberIds);
    client.emit('group-created', group);
  }
  */

  @SubscribeMessage('create-group')
  async handleCreateGroup(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { name: string; memberIds: string[] }
  ) {
    const group = await this.chatService.createGroup(data.name, data.memberIds);

    // Notifica al creador
    client.emit('group-created', group);
    client.join((group._id as string).toString());

    for (const memberId of data.memberIds) {
      if (!memberId) continue;

      const member = await this.chatService.getUserBy(memberId);

      if (member?.socketId) {
        // Notifica al miembro que fue agregado
        this.server.to(member.socketId).emit('added-to-group', group);

        // Lo une a la sala del grupo
        this.server.sockets.sockets.get(member.socketId)?.join((group._id as string).toString());

        // Envía la lista actualizada de grupos a cada usuario
        const updatedGroups = await this.chatService.getUserGroups(memberId);
        this.server.to(member.socketId).emit('user-groups', updatedGroups);
      }
    }

    // También actualiza la lista de grupos del creador
    const creatorGroups = await this.chatService.getUserGroups(data.memberIds[0]);
    client.emit('user-groups', creatorGroups);
  }



  @SubscribeMessage('get-groups-by-user')
  async handleGetGroups(
    @ConnectedSocket() client: Socket,
    @MessageBody() userId: string
  ) {
    const groups = await this.chatService.getUserGroups(userId);
    client.emit('user-groups', groups);
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

  @SubscribeMessage('send-friend-request')
  async handleSendFriendRequest(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { userId: string, targetId: string }
  ) {
    await this.userService.addFriend(data.userId, data.targetId);

    const target = await this.chatService.getUserBy(data.targetId);
    if (target?.socketId) {
      this.server.to(target.socketId).emit('friend-request', {
        from: data.userId,
      });
    }

    client.emit('request-sent', { to: data.targetId });
  }

}
