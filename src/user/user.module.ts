import { forwardRef, Module } from '@nestjs/common';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { ChatModule } from 'src/chat/chat.module';

@Module({
    imports: [forwardRef(() => ChatModule)],
    controllers: [UserController],
    providers: [UserService],
    exports: [UserService],
})
export class UserModule {}
