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
        return await this.userModel.create(input);
    }

    async signIn(input: UserDtoSignin): Promise<UserDocument> {
        const user = await this.userModel.findOne({ username: input.username });
        if (!user) throw new Error('User not found');
        if (user.password !== input.password) throw new Error('Invalid password');
        return user;
    }

}
