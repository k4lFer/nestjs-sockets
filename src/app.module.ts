import { Module } from '@nestjs/common';
import { ServerGateway } from './chat/services/server.gateway';
import { DatabaseModule } from './shared/database/database.module';
import { UserSchema } from './chat/schemas/user.schema';
import { ChatSchema } from './chat/schemas/chat.schema';
import { MessageSchema } from './chat/schemas/message.schema';
import { MongooseModule } from '@nestjs/mongoose';
import { ChatService } from './chat/services/chat.service';
import { ConfigModule } from '@nestjs/config';
import { UserModule } from './user/user.module';
import { ChatModule } from './chat/chat.module';
import { AuthController } from './authentication/auth/auth.controller';
import { AuthenticationModule } from './authentication/authentication.module';
import configuration from './shared/common/config/configuration';


@Module({
  imports: [
    DatabaseModule,
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.development.env',
      load: [ configuration ],
    }),
 
    UserModule,
    ChatModule,
    AuthenticationModule,

  ],
  controllers: [AuthController],
  providers: [ServerGateway, ChatService],
})
export class AppModule {}
