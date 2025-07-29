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
    const existingUser = await this.chatService.getUserBy(userId);
    if (!existingUser) {
      client.emit('error', 'Usuario no encontrado');
      return;
    }

    // Si ya tenía socketId, desconectar el socket anterior
    if (existingUser.socketId && existingUser.socketId !== client.id) {
      const oldSocket = this.server.sockets.sockets.get(existingUser.socketId);
      if (oldSocket) {
        oldSocket.emit('forced-disconnect', 'Otro dispositivo se ha conectado con tu cuenta');
        oldSocket.disconnect(); // Cierra la conexión anterior
      }
    }

    // Ahora asociamos el nuevo socketId al usuario
    await this.chatService.joinUserById(userId, client.id);

    client.emit('welcome', {
      userId: existingUser._id,
    });

    const connectedUsers = await this.chatService.getConnectedUsers();
    this.server.emit('connected-users', connectedUsers.map(u => ({
      id: u._id,
      username: u.username,
    })));

    console.log(`Usuario ${existingUser.username} conectado con ID: ${existingUser._id}`);
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

  @SubscribeMessage('typing')
  handleTyping(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { chatId: string; userId: string }
  ) {
    client.to(data.chatId).emit('user-typing', data.userId);
  }

  @SubscribeMessage('message-status')
  async handleMessageStatus(
    @MessageBody() data: { messageId: string; status: 'sent' | 'seen' }
  ) {
    await this.chatService.updateMessageStatus(data.messageId, data.status);
    const msg = await this.chatService.getMessageById(data.messageId);
    if (!msg) return; // Handle case where message might not be found
    this.server.to(msg.chat).emit('message-status-updated', { messageId: msg._id, status: data.status });
  }

  @SubscribeMessage('ping')
  handlePing(@ConnectedSocket() client: Socket) {
    // Actualiza el campo lastSeen
    this.chatService.updateLastSeen(client.id); // guarda Date.now()
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

  @SubscribeMessage('accept-friend-request')
  async handleAcceptFriendRequest(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { userId: string, requesterId: string }
  ) {
    await this.userService.acceptFriend(data.userId, data.requesterId);

    const requester = await this.chatService.getUserBy(data.requesterId);
    const user = await this.chatService.getUserBy(data.userId);

    // Notificar al que envió la solicitud
    if (requester?.socketId) {
      this.server.to(requester.socketId).emit('friend-accepted', {
        from: data.userId,
      });
    }

    // Notificar al que la aceptó (opcional, si quieres simetría)
    if (user?.socketId) {
      this.server.to(user.socketId).emit('friend-accepted', {
        from: data.requesterId,
      });
    }

    // Confirmación al cliente que aceptó
    client.emit('friend-added', { with: data.requesterId });
  }

  
  @SubscribeMessage('reject-friend-request')
  async handleRejectFriendRequest(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { userId: string, requesterId: string }
  ) {
    await this.userService.rejectFriend(data.userId, data.requesterId);

    const requester = await this.chatService.getUserBy(data.requesterId);
    if (requester?.socketId) {
      this.server.to(requester.socketId).emit('friend-request-rejected', {
        from: data.userId,
      });
    }

    client.emit('request-rejected', { from: data.requesterId });
  }

}
