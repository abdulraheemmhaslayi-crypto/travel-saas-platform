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
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { SupportService } from './support.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import {
  CreateTicketDto,
  UpdateTicketDto,
  TicketResponseDto,
  TicketQueryDto,
  TicketStatsDto,
  AssignTicketDto,
  EscalateTicketDto,
} from './dto/support.dto';
import { RoleName } from '../database/entities/role.entity';

@ApiTags('Support')
@Controller('support')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class SupportController {
  constructor(private readonly supportService: SupportService) {}

  @Post('tickets')
  @Roles(RoleName.PASSENGER, RoleName.DRIVER, RoleName.ADMIN, RoleName.SUPER_ADMIN, RoleName.FLEET_MANAGER, RoleName.VEHICLE_OWNER)
  @ApiOperation({ summary: 'Create a new support ticket' })
  async createTicket(
    @Body() dto: CreateTicketDto,
    @CurrentUser() user: any,
  ): Promise<TicketResponseDto> {
    return this.supportService.createTicket(dto, user.userId);
  }

  @Get('tickets')
  @Roles(RoleName.PASSENGER, RoleName.DRIVER, RoleName.ADMIN, RoleName.SUPER_ADMIN, RoleName.FLEET_MANAGER, RoleName.VEHICLE_OWNER, RoleName.SUPPORT_AGENT, RoleName.SUPPORT)
  @ApiOperation({ summary: 'Get support tickets with filters' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'priority', required: false })
  @ApiQuery({ name: 'category', required: false })
  async getTickets(
    @Query() query: TicketQueryDto,
    @CurrentUser() user: any,
  ): Promise<{ data: TicketResponseDto[]; total: number; page: number; limit: number }> {
    return this.supportService.getTickets(query, user);
  }

  @Get('tickets/:id')
  @Roles(RoleName.PASSENGER, RoleName.DRIVER, RoleName.ADMIN, RoleName.SUPER_ADMIN, RoleName.FLEET_MANAGER, RoleName.VEHICLE_OWNER, RoleName.SUPPORT_AGENT, RoleName.SUPPORT)
  @ApiOperation({ summary: 'Get ticket by ID' })
  async getTicketById(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: any,
  ): Promise<TicketResponseDto> {
    return this.supportService.getTicketById(id, user);
  }

  @Patch('tickets/:id')
  @Roles(RoleName.PASSENGER, RoleName.DRIVER, RoleName.ADMIN, RoleName.SUPER_ADMIN, RoleName.FLEET_MANAGER, RoleName.VEHICLE_OWNER, RoleName.SUPPORT_AGENT, RoleName.SUPPORT)
  @ApiOperation({ summary: 'Update ticket' })
  async updateTicket(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateTicketDto,
    @CurrentUser() user: any,
  ): Promise<TicketResponseDto> {
    return this.supportService.updateTicket(id, dto, user);
  }

  @Post('tickets/:id/assign')
  @Roles(RoleName.ADMIN, RoleName.SUPER_ADMIN, RoleName.SUPPORT_AGENT, RoleName.SUPPORT, RoleName.FLEET_MANAGER, RoleName.VEHICLE_OWNER)
  @ApiOperation({ summary: 'Assign ticket to agent' })
  async assignTicket(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AssignTicketDto,
    @CurrentUser() user: any,
  ): Promise<TicketResponseDto> {
    return this.supportService.assignTicket(id, dto, user);
  }

  @Post('tickets/:id/escalate')
  @Roles(RoleName.ADMIN, RoleName.SUPER_ADMIN, RoleName.SUPPORT_AGENT, RoleName.SUPPORT, RoleName.FLEET_MANAGER, RoleName.VEHICLE_OWNER)
  @ApiOperation({ summary: 'Escalate ticket priority' })
  async escalateTicket(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: EscalateTicketDto,
    @CurrentUser() user: any,
  ): Promise<TicketResponseDto> {
    return this.supportService.escalateTicket(id, dto, user);
  }

  @Post('tickets/:id/resolve')
  @Roles(RoleName.ADMIN, RoleName.SUPER_ADMIN, RoleName.SUPPORT_AGENT, RoleName.SUPPORT, RoleName.FLEET_MANAGER, RoleName.VEHICLE_OWNER)
  @ApiOperation({ summary: 'Resolve ticket' })
  async resolveTicket(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('resolution') resolution: string,
    @CurrentUser() user: any,
  ): Promise<TicketResponseDto> {
    return this.supportService.resolveTicket(id, resolution, user);
  }

  @Post('tickets/:id/reopen')
  @Roles(RoleName.PASSENGER, RoleName.ADMIN, RoleName.SUPER_ADMIN, RoleName.SUPPORT_AGENT, RoleName.SUPPORT)
  @ApiOperation({ summary: 'Reopen resolved ticket' })
  async reopenTicket(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('reason') reason: string,
    @CurrentUser() user: any,
  ): Promise<TicketResponseDto> {
    return this.supportService.reopenTicket(id, reason, user);
  }

  @Post('tickets/:id/comments')
  @Roles(RoleName.PASSENGER, RoleName.DRIVER, RoleName.ADMIN, RoleName.SUPER_ADMIN, RoleName.FLEET_MANAGER, RoleName.VEHICLE_OWNER, RoleName.SUPPORT_AGENT, RoleName.SUPPORT)
  @ApiOperation({ summary: 'Add comment to ticket' })
  async addComment(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('message') message: string,
    @CurrentUser() user: any,
  ): Promise<TicketResponseDto> {
    return this.supportService.addComment(id, message, user);
  }

  @Delete('tickets/:id')
  @Roles(RoleName.ADMIN, RoleName.SUPER_ADMIN)
  @ApiOperation({ summary: 'Delete ticket (soft delete)' })
  async deleteTicket(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: any,
  ): Promise<{ message: string }> {
    return this.supportService.deleteTicket(id, user);
  }

  @Get('stats')
  @Roles(RoleName.ADMIN, RoleName.SUPER_ADMIN, RoleName.FLEET_MANAGER, RoleName.VEHICLE_OWNER, RoleName.SUPPORT_AGENT, RoleName.SUPPORT)
  @ApiOperation({ summary: 'Get support ticket statistics' })
  async getStats(
    @Query('days', new DefaultValuePipe(30), ParseIntPipe) days: number,
    @CurrentUser() user: any,
  ): Promise<TicketStatsDto> {
    return this.supportService.getStats(days, user);
  }

  @Get('categories')
  @ApiOperation({ summary: 'Get available ticket categories' })
  async getCategories(): Promise<{ id: string; name: string; description: string }[]> {
    return this.supportService.getCategories();
  }
}