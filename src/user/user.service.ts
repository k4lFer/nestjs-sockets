import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Types } from 'mongoose';
import { UserDocument } from 'src/chat/schemas/user.schema';
import { UserPatchDto } from './user-dto.patch';

@Injectable()
export class UserService {
    constructor(
        @InjectModel('User') private userModel: Model<UserDocument>,
    ) {}

    async updatePassword(userId: string, newPassword: string, currentPassword: string) {
        const user = await this.userModel.findById(userId);
        if (!user) throw new Error('Usuario no encontrado');
        if (user.password !== currentPassword) throw new Error('Contraseña incorrecta');
        if (user.password === newPassword) throw new Error('La nueva contraseña debe ser diferente a la actual');
        user.password = newPassword;
        await user.save();
        return user;
    }

    async profile(userId: string) {
        const user = await this.userModel.findById(userId);
        if (!user) throw new Error('Usuario no encontrado');
        return user;
    }
    async updateProfile(userId: string, updates: Partial<UserPatchDto>) {
        const user = await this.userModel.findById(userId);
        if (!user) throw new Error('Usuario no encontrado');

        if (updates.bio) user.bio = updates.bio;
        if (updates.email) user.email = updates.email;

        await user.save();

        return user;
        }


    async addFriend(userId: string, friendId: string) {
        if (userId === friendId) throw new Error('No puedes agregarte a ti mismo');

        const user = await this.userModel.findById(userId);
        const friend = await this.userModel.findById(friendId);
        if (!user || !friend) throw new Error('Usuario no encontrado');

        const friendObjId = new Types.ObjectId(friendId);
        const userObjId = new Types.ObjectId(userId);

        // Validaciones
        if (user.friends.some(f => f.equals(friendObjId))) throw new Error('Ya son amigos');
        if (user.sentRequests.some(r => r.equals(friendObjId))) throw new Error('Solicitud ya enviada');
        if (user.pendingRequests.some(r => r.equals(friendObjId))) throw new Error('Solicitud pendiente de ese usuario');

        // Agregar solicitud
        user.sentRequests.push(friendObjId);
        friend.pendingRequests.push(userObjId);

        await user.save();
        await friend.save();

        return { message: 'Solicitud de amistad enviada' };
    }

    async acceptFriend(userId: string, friendId: string) {
        const user = await this.userModel.findById(userId);
        const friend = await this.userModel.findById(friendId);
        if (!user || !friend) throw new Error('Usuario no encontrado');

        const isPending = user.pendingRequests.some(id => id.toString() === friendId);
        if (!isPending) throw new Error('No hay una solicitud pendiente de este usuario');

        const alreadyFriends = user.friends.some(id => id.toString() === friendId);
        if (alreadyFriends) throw new Error('Ya son amigos');

        // Eliminar solicitudes
        user.pendingRequests = user.pendingRequests.filter(id => id.toString() !== friendId);
        friend.sentRequests = friend.sentRequests.filter(id => id.toString() !== userId);

        // Agregar a amigos
        user.friends.push(friend._id as Types.ObjectId);
        friend.friends.push(user._id as Types.ObjectId);

        await user.save();
        await friend.save();

        return { message: 'Solicitud aceptada' };
    }

    async rejectFriend(userId: string, friendId: string) {
        const user = await this.userModel.findById(userId);
        const friend = await this.userModel.findById(friendId);
        if (!user || !friend) throw new Error('Usuario no encontrado');

        const isPending = user.pendingRequests.some(id => id.toString() === friendId);
        if (!isPending) throw new Error('No hay solicitud de este usuario');

        user.pendingRequests = user.pendingRequests.filter(id => id.toString() !== friendId);
        friend.sentRequests = friend.sentRequests.filter(id => id.toString() !== userId);

        await user.save();
        await friend.save();

        return { message: 'Solicitud rechazada' };
    }

    async removeFriend(userId: string, friendId: string) {
        const user = await this.userModel.findById(userId);
        const friend = await this.userModel.findById(friendId);
        if (!user || !friend) throw new Error('Usuario no encontrado');

        const wereFriends = user.friends.some(id => id.toString() === friendId);
        if (!wereFriends) throw new Error('No son amigos');

        user.friends = user.friends.filter(id => id.toString() !== friendId);
        friend.friends = friend.friends.filter(id => id.toString() !== userId);

        await user.save();
        await friend.save();

        return { message: 'Amigo eliminado' };
    }


    async getFriends(userId: string, search = '', page = 1, limit = 10) {
        const user = await this.userModel.findById(userId).populate('friends');
        if (!user) throw new Error('Usuario no encontrado');

        // Filtro por nombre o username (insensible a mayúsculas)
        const filtered = user.friends.filter((friend: any) => {
            const regex = new RegExp(search, 'i');
            return regex.test(friend.username) || regex.test(friend.name || '');
        });

        // Ordenar: conectados primero
        const sorted = filtered.sort((a: any, b: any) => {
        const now = Date.now();

        // Consideramos conectado si ha enviado un ping en los últimos 60 segundos
        const aConnected = now - new Date(a.lastSeen).getTime() < 60000;
        const bConnected = now - new Date(b.lastSeen).getTime() < 60000;

        return Number(bConnected) - Number(aConnected);
        });

        // Paginación
        const start = (page - 1) * limit;
        const paginated = sorted.slice(start, start + limit);

        return {
            total: sorted.length,
            page,
            limit,
            results: paginated,
        };
    }

    async getPendingRequests(userId: string) {
        const user = await this.userModel.findById(userId).populate('pendingRequests');
        return user?.pendingRequests || [];
    }

    async getSentRequests(userId: string) {
        const user = await this.userModel.findById(userId).populate('sentRequests');
        return user?.sentRequests || [];
    }

    async searchAllUsers(
        currentUserId: string,
        search: string = '',
        page: number = 1,
        limit: number = 10,
        ): Promise<{
        users: {
            _id: string;
            username: string;
            isFriend: boolean;
            sentRequest: boolean;
            receivedRequest: boolean;
            connected: boolean;
        }[],
        total: number,
        page: number,
        totalPages: number
        }> {
        const currentUser = await this.userModel.findById(currentUserId);

        if (!currentUser) throw new Error('Usuario actual no encontrado');

        const query = {
            _id: { $ne: currentUserId },
            username: { $regex: new RegExp(search, 'i') },
        };

        const total = await this.userModel.countDocuments(query);
        const totalPages = Math.ceil(total / limit);

        const rawUsers = await this.userModel
            .find(query)
            .skip((page - 1) * limit)
            .limit(limit)
            .select('_id username socketId');

        const users = rawUsers.map(user => {
            const idStr = (user._id as Types.ObjectId).toString();
            return {
            _id: idStr,
            username: user.username,
            connected: !!user.socketId,
            isFriend: currentUser.friends.some(f => f.toString() === idStr),
            sentRequest: currentUser.sentRequests.some(r => r.toString() === idStr),
            receivedRequest: currentUser.pendingRequests.some(p => p.toString() === idStr),
            };
        });

        return { users, total, page, totalPages };
    }
  
}
