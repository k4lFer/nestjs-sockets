import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { UserDocument } from 'src/chat/schemas/user.schema';
import { UserDtoSignin } from 'src/user/user-dto.signin';
import { UserDtoSignUp } from 'src/user/user-dto.signup';

@Injectable()
export class AuthService {
    constructor(
        @InjectModel('User') public userModel: Model<UserDocument>,
    ) {}

    async signUp(input: UserDtoSignUp): Promise<UserDocument> {
        /*if(input === undefined) throw new Error('User not found');

        const user = await this.userModel.findOne({ username: input.username });
        if(user) throw new Error('User already exists');

        return await this.userModel.create(input);*/
        if (!input) throw new Error('Datos requeridos');
        const existing = await this.userModel.findOne({ username: input.username });
        if (existing) throw new Error('Usuario ya existe');

        const user = new this.userModel({
            username: input.username,
            password: input.password,
            email: input.email,
        });

        return await user.save();
    }

    async signIn(input: UserDtoSignin): Promise<UserDocument> {
        const user = await this.userModel.findOne({ username: input.username });
        if (!user) throw new Error('User not found');
        if (user.password !== input.password) throw new Error('Invalid password');
        return user;

    }

}
