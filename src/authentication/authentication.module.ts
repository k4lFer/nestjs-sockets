import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { ChatModule } from 'src/chat/chat.module';
import { MongooseModule } from '@nestjs/mongoose';
import { UserSchema } from 'src/chat/schemas/user.schema';

@Module({
  imports: [
    ChatModule,
  ],
  providers: [AuthService],
  controllers: [AuthController],
  exports: [AuthService],
})
export class AuthenticationModule {}
