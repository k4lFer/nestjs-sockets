import { Module } from '@nestjs/common';
import { DatabaseModule } from './shared/database/database.module';
import { ConfigModule } from '@nestjs/config';
import { UserModule } from './user/user.module';
import { ChatModule } from './chat/chat.module';
import { AuthenticationModule } from './authentication/authentication.module';
import { FileModule } from './file/file.module';
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
    FileModule,

  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
