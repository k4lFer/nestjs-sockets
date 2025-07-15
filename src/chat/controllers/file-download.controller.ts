import {
  Controller,
  Get,
  Param,
  Res,
  NotFoundException,
} from '@nestjs/common';
import { ChatService } from '../services/chat.service';
import { Response } from 'express';

@Controller('download')
export class FileDownloadController {
  constructor(private readonly chatService: ChatService) {}

  @Get(':messageId')
  async downloadFile(@Param('messageId') messageId: string, @Res() res: Response) {
    const message = await this.chatService.getMessageById(messageId);
    if (!message?.file) throw new NotFoundException('Archivo no encontrado');

    const file = message.file;

    res.setHeader('Content-Disposition', `attachment; filename="${file.filename}"`);
    res.setHeader('Content-Type', file.mimetype);

    if (file.storageType === 'buffer' && file.data) {
      return res.send(Buffer.from(file.data));
    }

    if (file.storageType === 'gridfs' && file.fileId) {
      const stream = this.chatService.getFileStreamFromGridFS(file.fileId);
      return stream.pipe(res);
    }

    throw new NotFoundException('Archivo inválido o incompleto');
  }
}
