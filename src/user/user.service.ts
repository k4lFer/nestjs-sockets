import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Types } from 'mongoose';
import { UserDocument } from 'src/chat/schemas/user.schema';

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

    async addFriend(userId: string, friendId: string) {
        if (userId === friendId) throw new Error('No puedes agregarte a ti mismo');
        const user = await this.userModel.findById(userId);
        const friend = await this.userModel.findById(friendId);
        if (!user || !friend) throw new Error('Usuario no encontrado');

        if (user.friends.some(f => f.equals(new Types.ObjectId(friendId)))) throw new Error('Ya son amigos');
        if (user.sentRequests.some(r => r.equals(new Types.ObjectId(friendId)))) throw new Error('Solicitud ya enviada');
        if (user.pendingRequests.some(r => r.equals(new Types.ObjectId(friendId)))) throw new Error('Solicitud pendiente de ese usuario');

        user.sentRequests.push(new Types.ObjectId(friendId));
        friend.pendingRequests.push(new Types.ObjectId(userId));

        await user.save();
        await friend.save();

        return { message: 'Solicitud de amistad enviada' };
    }


    async acceptFriend(userId: string, friendId: string) {
        const user = await this.userModel.findById(userId);
        const friend = await this.userModel.findById(friendId);
        if (!user || !friend) throw new Error('Usuario no encontrado');

        // Eliminar solicitudes
        user.pendingRequests = user.pendingRequests.filter(id => id.toString() !== friendId);
        friend.sentRequests = friend.sentRequests.filter(id => id.toString() !== userId);

        // Agregar a amigos
        user.friends.push(new Types.ObjectId(friendId));
        friend.friends.push(new Types.ObjectId(userId));

        await user.save();
        await friend.save();

        return { message: 'Solicitud aceptada' };
    }


    async rejectFriend(userId: string, friendId: string) {
        const user = await this.userModel.findById(userId);
        const friend = await this.userModel.findById(friendId);
        if (!user || !friend) throw new Error('Usuario no encontrado');

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
            const aConnected = !!a.socketId;
            const bConnected = !!b.socketId;
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
