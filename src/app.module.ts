import { Module } from '@nestjs/common';
import { ServerGateway } from './chat/services/server.gateway';
import { DatabaseModule } from './shared/database/database.module';
import { ChatService } from './chat/services/chat.service';
import { ConfigModule } from '@nestjs/config';
import { UserModule } from './user/user.module';
import { ChatModule } from './chat/chat.module';
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
  controllers: [],
  providers: [ServerGateway, ChatService],
})
export class AppModule {}
