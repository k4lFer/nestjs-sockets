import { forwardRef, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UserSchema } from './schemas/user.schema';
import { ChatSchema } from './schemas/chat.schema';
import { MessageSchema } from './schemas/message.schema';
import { ServerGateway } from './services/server.gateway';
import { ChatService } from './services/chat.service';
import { FileUploadController } from './controllers/file-upload.controller';
import { FileDownloadController } from './controllers/file-download.controller';
import { UserModule } from 'src/user/user.module';

@Module({
    imports: [
        MongooseModule.forFeature([
        { name: 'User', schema: UserSchema },
        { name: 'Chat', schema: ChatSchema },
        { name: 'Message', schema: MessageSchema },

        ]),
        forwardRef(() => UserModule)        
    ],
    controllers: [FileUploadController, FileDownloadController],
    providers: [ChatService, ServerGateway],
    exports: [
        ChatService,
        MongooseModule,
    ],
})
export class ChatModule {}
