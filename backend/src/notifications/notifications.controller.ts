import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  ParseUUIDPipe,
  DefaultValuePipe,
  ParseIntPipe,
  Sse,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { Observable } from 'rxjs';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { RoleName } from '../database/entities/role.entity';
import {
  CreateNotificationDto,
  NotificationResponseDto,
  NotificationQueryDto,
  MarkReadDto,
  NotificationPreferencesDto,
  UnreadCountDto,
} from './notifications.dto';

@ApiTags('Notifications')
@Controller('notifications')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Post()
  @Roles(RoleName.ADMIN, RoleName.SUPER_ADMIN)
  @ApiOperation({ summary: 'Create a notification (admin only)' })
  async createNotification(
    @Body() dto: CreateNotificationDto,
  ): Promise<NotificationResponseDto> {
    return this.notificationsService.createNotification(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get user notifications' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'unreadOnly', required: false, type: Boolean })
  @ApiQuery({ name: 'type', required: false })
  async getNotifications(
    @Query() query: NotificationQueryDto,
    @CurrentUser() user: any,
  ): Promise<{ data: NotificationResponseDto[]; total: number; unreadCount: number }> {
    return this.notificationsService.getNotifications(user.userId, query);
  }

  @Get('unread-count')
  @ApiOperation({ summary: 'Get unread notification count' })
  async getUnreadCount(@CurrentUser() user: any): Promise<UnreadCountDto> {
    return this.notificationsService.getUnreadCount(user.userId);
  }

  @Patch('mark-read')
  @ApiOperation({ summary: 'Mark notifications as read' })
  async markAsRead(
    @Body() dto: MarkReadDto,
    @CurrentUser() user: any,
  ): Promise<{ updated: number }> {
    return this.notificationsService.markAsRead(user.userId, dto);
  }

  @Patch('mark-all-read')
  @ApiOperation({ summary: 'Mark all notifications as read' })
  async markAllAsRead(@CurrentUser() user: any): Promise<{ updated: number }> {
    return this.notificationsService.markAllAsRead(user.userId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a notification' })
  async deleteNotification(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: any,
  ): Promise<{ message: string }> {
    return this.notificationsService.deleteNotification(id, user.userId);
  }

  @Get('preferences')
  @ApiOperation({ summary: 'Get notification preferences' })
  async getPreferences(@CurrentUser() user: any): Promise<NotificationPreferencesDto> {
    return this.notificationsService.getPreferences(user.userId);
  }

  @Patch('preferences')
  @ApiOperation({ summary: 'Update notification preferences' })
  async updatePreferences(
    @Body() dto: NotificationPreferencesDto,
    @CurrentUser() user: any,
  ): Promise<NotificationPreferencesDto> {
    return this.notificationsService.updatePreferences(user.userId, dto);
  }

  @Sse('stream')
  @ApiOperation({ summary: 'SSE stream for real-time notifications' })
  notificationStream(@CurrentUser() user: any): Observable<MessageEvent> {
    return this.notificationsService.subscribeToUserEvents(user.userId);
  }
}