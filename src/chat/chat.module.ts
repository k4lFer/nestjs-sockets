import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UserSchema } from './schemas/user.schema';
import { ChatSchema } from './schemas/chat.schema';
import { MessageSchema } from './schemas/message.schema';
import { ServerGateway } from './services/server.gateway';
import { ChatService } from './services/chat.service';

@Module({
    imports: [
        MongooseModule.forFeature([
        { name: 'User', schema: UserSchema },
        { name: 'Chat', schema: ChatSchema },
        { name: 'Message', schema: MessageSchema },

        ]),        
    ],
    providers: [ChatService, ServerGateway],
    exports: [
        ChatService,
        MongooseModule,
    ],
})
export class ChatModule {}
