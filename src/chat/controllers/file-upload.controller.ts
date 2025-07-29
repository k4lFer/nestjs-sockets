import { Body, Controller, Post, UploadedFile, UseInterceptors } from "@nestjs/common";
import { ChatService } from "../services/chat.service";
import { FileInterceptor } from "@nestjs/platform-express";
import { ServerGateway } from "../services/server.gateway";

@Controller('upload')
export class FileUploadController {
    constructor(
        private readonly chatService: ChatService,
        private readonly serverGateway: ServerGateway) {}

  @Post()
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Body('senderId') senderId: string,
    @Body('chatId') chatId: string,
    @Body('message') message: string,
  ) {
    const result = await this.chatService.createMessageFromBuffer(
      senderId,
      chatId,
      message,
      file,
    );
    this.serverGateway.server.to(chatId).emit('new-message', result);
    return result; // frontend recibe el mensaje completo
  }

}