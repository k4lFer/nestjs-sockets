import { Module } from '@nestjs/common';
import { ServerGateway } from './services/server.gateway';
import { DatabaseModule } from './shared/database/database.module';
import { UserSchema } from './schemas/user.schema';
import { ChatSchema } from './schemas/chat.schema';
import { MessageSchema } from './schemas/message.schema';
import { MongooseModule } from '@nestjs/mongoose';
import { ChatService } from './services/chat.service';
import { ConfigModule } from '@nestjs/config';
import { UserModule } from './user/user.module';
import { ChatModule } from './chat/chat.module';
import configuration from './shared/common/config/configuration';


@Module({
  imports: [DatabaseModule,
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.development.env',
      load: [ configuration ],
    }),
    MongooseModule.forFeature([
      { name: 'User', schema: UserSchema },
      { name: 'Chat', schema: ChatSchema },
      { name: 'Message', schema: MessageSchema },

    ]),
    
    UserModule,
    ChatModule,

  ],
  controllers: [],
  providers: [ServerGateway, ChatService],
})
export class AppModule {}
