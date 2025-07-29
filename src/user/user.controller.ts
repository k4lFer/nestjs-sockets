import {
  Controller,
  Get,
  Patch,
  Body,
  Query,
  BadRequestException,
} from '@nestjs/common';
import { UserService } from './user.service';
import { UserPatchDto } from './user-dto.patch';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  // Obtener perfil
  @Get('profile')
  async profile(@Query('userId') userId: string) {
    if (!userId) throw new BadRequestException('userId es requerido');
    return await this.userService.profile(userId);
  }

  // Cambiar contraseña
  @Patch('update-password')
  async updatePassword(
    @Body()
    body: {
      userId: string;
      currentPassword: string;
      newPassword: string;
    },
  ) {
    const { userId, currentPassword, newPassword } = body;
    if (!userId || !currentPassword || !newPassword)
      throw new BadRequestException('Datos incompletos');
    return await this.userService.updatePassword(userId, newPassword, currentPassword);
  }

  // Actualizar perfil
  @Patch('update-profile')
  async updateProfile(@Body() body: { userId: string; updates: Partial<UserPatchDto> }) {
    const { userId, updates } = body;
    if (!userId || !updates) throw new BadRequestException('Datos incompletos');
    return await this.userService.updateProfile(userId, updates);
  }

  // Obtener amigos con paginación y búsqueda
  @Get('friends')
  async getFriends(
    @Query('userId') userId: string,
    @Query('search') search = '',
    @Query('page') page = '1',
    @Query('limit') limit = '10',
  ) {
    if (!userId) throw new BadRequestException('userId es requerido');
    return await this.userService.getFriends(userId, search, parseInt(page), parseInt(limit));
  }

  // Obtener solicitudes pendientes
  @Get('pending-requests')
  async getPendingRequests(@Query('userId') userId: string) {
    if (!userId) throw new BadRequestException('userId es requerido');
    return await this.userService.getPendingRequests(userId);
  }

  // Obtener solicitudes enviadas
  @Get('sent-requests')
  async getSentRequests(@Query('userId') userId: string) {
    if (!userId) throw new BadRequestException('userId es requerido');
    return await this.userService.getSentRequests(userId);
  }

  // Buscar usuarios (excluyendo al actual)
  @Get('search')
  async searchAllUsers(
    @Query('currentUserId') currentUserId: string,
    @Query('search') search = '',
    @Query('page') page = '1',
    @Query('limit') limit = '10',
  ) {
    if (!currentUserId) throw new BadRequestException('currentUserId es requerido');
    return await this.userService.searchAllUsers(
      currentUserId,
      search,
      parseInt(page),
      parseInt(limit),
    );
  }
}
