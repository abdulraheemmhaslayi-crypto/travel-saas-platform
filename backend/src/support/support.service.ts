// import {
//   Injectable,
//   Logger,
//   NotFoundException,
//   ForbiddenException,
//   BadRequestException,
// } from '@nestjs/common';
// import { InjectRepository } from '@nestjs/typeorm';
// import { Repository, Between, Like } from 'typeorm';
// import { SupportTicket } from '../database/entities/support-ticket.entity';
// import { User } from '../database/entities/user.entity';
// import { Notification } from '../database/entities/notification.entity';
// import { NotificationsService } from '../notifications/notifications.service';
// import { KafkaService } from '../kafka/kafka.service';
// import { RedisService } from '../redis/redis.service';
// import {
//   CreateTicketDto,
//   UpdateTicketDto,
//   TicketResponseDto,
//   TicketQueryDto,
//   TicketStatsDto,
//   AssignTicketDto,
//   EscalateTicketDto,
//   TicketCommentDto,
// } from './dto/support.dto';

// @Injectable()
// export class SupportService {
//   private readonly logger = new Logger(SupportService.name);

//   constructor(
//     @InjectRepository(SupportTicket)
//     private readonly ticketRepository: Repository<<SupportTicket>,
//     @InjectRepository(User)
//     private readonly userRepository: Repository<User>,
//     @InjectRepository(Notification)
//     private readonly notificationRepository: Repository<<Notification>,
//     private readonly notificationsService: NotificationsService,
//     private readonly kafkaService: KafkaService,
//     private readonly redisService: RedisService,
//   ) {}

//   async createTicket(dto: CreateTicketDto, userId: string): Promise<TicketResponseDto> {
//     const user = await this.userRepository.findOne({ where: { id: userId } });
//     if (!user) throw new NotFoundException('User not found');

//     const ticket = this.ticketRepository.create({
//       ...dto,
//       user,
//       status: 'OPEN',
//       createdAt: new Date(),
//       updatedAt: new Date(),
//     });

//     const saved = await this.ticketRepository.save(ticket);

//     // Send notification to user
//     await this.notificationsService.sendToUser(userId, {
//       title: 'Support Ticket Created',
//       body: `Ticket #${saved.ticketNumber} has been created successfully. We'll get back to you soon.`,
//       type: 'SUPPORT',
//       data: { ticketId: saved.id, ticketNumber: saved.ticketNumber },
//     });

//     // Notify support agents via Kafka
//     await this.kafkaService.publish('support.ticket.created', {
//       ticketId: saved.id,
//       ticketNumber: saved.ticketNumber,
//       category: saved.category,
//       priority: saved.priority,
//       userId,
//     });

//     this.logger.log(`Ticket created: ${saved.ticketNumber} by user ${userId}`);
//     return this.mapToResponseDto(saved);
//   }

//   async getTickets(
//     query: TicketQueryDto,
//     user: any,
//   ): Promise<{ data: TicketResponseDto[]; total: number; page: number; limit: number }> {
//     const { page = 1, limit = 20, status, priority, category, search, assignedToMe } = query;
//     const skip = (page - 1) * limit;

//     const qb = this.ticketRepository.createQueryBuilder('ticket')
//       .leftJoinAndSelect('ticket.user', 'user')
//       .leftJoinAndSelect('ticket.assignedTo', 'assignedTo')
//       .leftJoinAndSelect('ticket.comments', 'comments')
//       .orderBy('ticket.createdAt', 'DESC')
//       .skip(skip)
//       .take(limit);

//     // Role-based filtering
//     if (user.role === 'USER' || user.role === 'DRIVER') {
//       qb.andWhere('ticket.userId = :userId', { userId: user.userId });
//     } else if (user.role === 'FLEET_MANAGER' && user.fleetCompanyId) {
//       qb.andWhere('ticket.fleetCompanyId = :fleetCompanyId', { fleetCompanyId: user.fleetCompanyId });
//     }

//     if (status) qb.andWhere('ticket.status = :status', { status });
//     if (priority) qb.andWhere('ticket.priority = :priority', { priority });
//     if (category) qb.andWhere('ticket.category = :category', { category });
//     if (search) {
//       qb.andWhere(
//         '(ticket.subject LIKE :search OR ticket.description LIKE :search OR ticket.ticketNumber LIKE :search)',
//         { search: `%${search}%` },
//       );
//     }
//     if (assignedToMe) {
//       qb.andWhere('ticket.assignedToId = :assignedToId', { assignedToId: user.userId });
//     }

//     const [tickets, total] = await qb.getManyAndCount();

//     return {
//       data: tickets.map((t) => this.mapToResponseDto(t)),
//       total,
//       page,
//       limit,
//     };
//   }

//   async getTicketById(id: string, user: any): Promise<TicketResponseDto> {
//     const ticket = await this.ticketRepository.findOne({
//       where: { id },
//       relations: ['user', 'assignedTo', 'comments', 'comments.user'],
//     });

//     if (!ticket) throw new NotFoundException('Ticket not found');

//     // Authorization check
//     if (user.role === 'USER' || user.role === 'DRIVER') {
//       if (ticket.user.id !== user.userId) {
//         throw new ForbiddenException('You can only view your own tickets');
//       }
//     } else if (user.role === 'FLEET_MANAGER' && ticket.fleetCompanyId !== user.fleetCompanyId) {
//       throw new ForbiddenException('You can only view tickets from your fleet company');
//     }

//     return this.mapToResponseDto(ticket);
//   }

//   async updateTicket(id: string, dto: UpdateTicketDto, user: any): Promise<TicketResponseDto> {
//     const ticket = await this.getTicketById(id, user);

//     // Users can only update their own tickets and only if status is OPEN
//     if ((user.role === 'USER' || user.role === 'DRIVER') && ticket.status !== 'OPEN') {
//       throw new ForbiddenException('Cannot update ticket that is not open');
//     }

//     const updates: Partial<<SupportTicket> = {
//       ...dto,
//       updatedAt: new Date(),
//     };

//     await this.ticketRepository.update(id, updates);
//     const updated = await this.ticketRepository.findOne({
//       where: { id },
//       relations: ['user', 'assignedTo', 'comments'],
//     });

//     return this.mapToResponseDto(updated);
//   }

//   async assignTicket(id: string, dto: AssignTicketDto, user: any): Promise<TicketResponseDto> {
//     const ticket = await this.ticketRepository.findOne({
//       where: { id },
//       relations: ['user', 'assignedTo'],
//     });

//     if (!ticket) throw new NotFoundException('Ticket not found');

//     const agent = await this.userRepository.findOne({ where: { id: dto.agentId } });
//     if (!agent) throw new NotFoundException('Agent not found');

//     ticket.assignedTo = agent;
//     ticket.status = 'IN_PROGRESS';
//     ticket.updatedAt = new Date();

//     const saved = await this.ticketRepository.save(ticket);

//     // Notify user
//     await this.notificationsService.sendToUser(ticket.user.id, {
//       title: 'Ticket Assigned',
//       body: `Your ticket #${ticket.ticketNumber} has been assigned to an agent.`,
//       type: 'SUPPORT',
//       data: { ticketId: ticket.id, assignedTo: agent.name },
//     });

//     // Notify agent
//     await this.notificationsService.sendToUser(dto.agentId, {
//       title: 'New Ticket Assigned',
//       body: `Ticket #${ticket.ticketNumber} has been assigned to you.`,
//       type: 'SUPPORT',
//       data: { ticketId: ticket.id },
//     });

//     this.logger.log(`Ticket ${ticket.ticketNumber} assigned to ${dto.agentId}`);
//     return this.mapToResponseDto(saved);
//   }

//   async escalateTicket(id: string, dto: EscalateTicketDto, user: any): Promise<TicketResponseDto> {
//     const ticket = await this.ticketRepository.findOne({
//       where: { id },
//       relations: ['user'],
//     });

//     if (!ticket) throw new NotFoundException('Ticket not found');

//     const priorityOrder = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL', 'URGENT'];
//     const currentIndex = priorityOrder.indexOf(ticket.priority);
//     const newIndex = priorityOrder.indexOf(dto.newPriority);

//     if (newIndex <= currentIndex) {
//       throw new BadRequestException('New priority must be higher than current priority');
//     }

//     ticket.priority = dto.newPriority;
//     ticket.escalationReason = dto.reason;
//     ticket.escalatedAt = new Date();
//     ticket.escalatedBy = user.userId;
//     ticket.updatedAt = new Date();

//     const saved = await this.ticketRepository.save(ticket);

//     // Notify admins
//     await this.kafkaService.publish('support.ticket.escalated', {
//       ticketId: saved.id,
//       ticketNumber: saved.ticketNumber,
//       newPriority: saved.priority,
//       reason: dto.reason,
//       escalatedBy: user.userId,
//     });

//     this.logger.warn(`Ticket ${ticket.ticketNumber} escalated to ${dto.newPriority}`);
//     return this.mapToResponseDto(saved);
//   }

//   async resolveTicket(id: string, resolution: string, user: any): Promise<TicketResponseDto> {
//     const ticket = await this.ticketRepository.findOne({
//       where: { id },
//       relations: ['user', 'assignedTo'],
//     });

//     if (!ticket) throw new NotFoundException('Ticket not found');
//     if (ticket.status === 'RESOLVED' || ticket.status === 'CLOSED') {
//       throw new BadRequestException('Ticket is already resolved');
//     }

//     ticket.status = 'RESOLVED';
//     ticket.resolution = resolution;
//     ticket.resolvedAt = new Date();
//     ticket.resolvedBy = user.userId;
//     ticket.updatedAt = new Date();

//     const saved = await this.ticketRepository.save(ticket);

//     // Calculate resolution time
//     const resolutionTime = Math.round(
//       (saved.resolvedAt.getTime() - saved.createdAt.getTime()) / (1000 * 60),
//     );

//     // Notify user
//     await this.notificationsService.sendToUser(ticket.user.id, {
//       title: 'Ticket Resolved',
//       body: `Your ticket #${ticket.ticketNumber} has been resolved.`,
//       type: 'SUPPORT',
//       data: { ticketId: ticket.id, resolution, resolutionTime },
//     });

//     // Update cache stats
//     await this.updateStatsCache();

//     this.logger.log(`Ticket ${ticket.ticketNumber} resolved in ${resolutionTime} minutes`);
//     return this.mapToResponseDto(saved);
//   }

//   async reopenTicket(id: string, reason: string, user: any): Promise<TicketResponseDto> {
//     const ticket = await this.ticketRepository.findOne({
//       where: { id },
//       relations: ['user'],
//     });

//     if (!ticket) throw new NotFoundException('Ticket not found');
//     if (ticket.status !== 'RESOLVED' && ticket.status !== 'CLOSED') {
//       throw new BadRequestException('Only resolved or closed tickets can be reopened');
//     }

//     ticket.status = 'REOPENED';
//     ticket.reopenReason = reason;
//     ticket.reopenedAt = new Date();
//     ticket.reopenedBy = user.userId;
//     ticket.updatedAt = new Date();

//     const saved = await this.ticketRepository.save(ticket);

//     await this.notificationsService.sendToUser(ticket.user.id, {
//       title: 'Ticket Reopened',
//       body: `Your ticket #${ticket.ticketNumber} has been reopened.`,
//       type: 'SUPPORT',
//       data: { ticketId: ticket.id, reason },
//     });

//     return this.mapToResponseDto(saved);
//   }

//   async addComment(id: string, message: string, user: any): Promise<TicketResponseDto> {
//     const ticket = await this.ticketRepository.findOne({
//       where: { id },
//       relations: ['user', 'assignedTo', 'comments', 'comments.user'],
//     });

//     if (!ticket) throw new NotFoundException('Ticket not found');

//     const comment = {
//       id: crypto.randomUUID(),
//       message,
//       user: { id: user.userId, name: user.name, email: user.email },
//       createdAt: new Date(),
//       isInternal: user.role === 'USER' || user.role === 'DRIVER' ? false : true,
//     };

//     ticket.comments = [...(ticket.comments || []), comment];
//     ticket.updatedAt = new Date();

//     const saved = await this.ticketRepository.save(ticket);

//     // Notify relevant parties
//     const notifyUserId = ticket.user.id === user.userId && ticket.assignedTo
//       ? ticket.assignedTo.id
//       : ticket.user.id;

//     await this.notificationsService.sendToUser(notifyUserId, {
//       title: 'New Comment on Ticket',
//       body: `New comment on ticket #${ticket.ticketNumber}`,
//       type: 'SUPPORT',
//       data: { ticketId: ticket.id, commentId: comment.id },
//     });

//     return this.mapToResponseDto(saved);
//   }

//   async deleteTicket(id: string, user: any): Promise<{ message: string }> {
//     const ticket = await this.ticketRepository.findOne({ where: { id } });
//     if (!ticket) throw new NotFoundException('Ticket not found');

//     await this.ticketRepository.softDelete(id);
//     this.logger.log(`Ticket ${id} deleted by ${user.userId}`);

//     return { message: 'Ticket deleted successfully' };
//   }

//   async getStats(days: number, user: any): Promise<TicketStatsDto> {
//     const cacheKey = `support:stats:${days}:${user.fleetCompanyId || 'all'}`;
//     const cached = await this.redisService.get(cacheKey);
//     if (cached) return JSON.parse(cached);

//     const endDate = new Date();
//     const startDate = new Date();
//     startDate.setDate(startDate.getDate() - days);

//     const baseWhere = user.fleetCompanyId ? { fleetCompanyId: user.fleetCompanyId } : {};

//     const [
//       totalTickets,
//       openTickets,
//       inProgressTickets,
//       resolvedTickets,
//       closedTickets,
//       avgResolutionTime,
//       satisfactionScore,
//       ticketsByCategory,
//       ticketsByPriority,
//     ] = await Promise.all([
//       this.ticketRepository.count({
//         where: { createdAt: Between(startDate, endDate), ...baseWhere },
//       }),
//       this.ticketRepository.count({ where: { status: 'OPEN', ...baseWhere } }),
//       this.ticketRepository.count({ where: { status: 'IN_PROGRESS', ...baseWhere } }),
//       this.ticketRepository.count({ where: { status: 'RESOLVED', ...baseWhere } }),
//       this.ticketRepository.count({ where: { status: 'CLOSED', ...baseWhere } }),
//       this.getAverageResolutionTime(startDate, endDate, user.fleetCompanyId),
//       this.getSatisfactionScore(startDate, endDate, user.fleetCompanyId),
//       this.getTicketsByCategory(startDate, endDate, user.fleetCompanyId),
//       this.getTicketsByPriority(startDate, endDate, user.fleetCompanyId),
//     ]);

//     const stats: TicketStatsDto = {
//       totalTickets,
//       openTickets,
//       inProgressTickets,
//       resolvedTickets,
//       closedTickets,
//       avgResolutionTime,
//       satisfactionScore,
//       ticketsByCategory,
//       ticketsByPriority,
//       period: { startDate, endDate, days },
//     };

//     await this.redisService.set(cacheKey, JSON.stringify(stats), 300);
//     return stats;
//   }

//   private async getAverageResolutionTime(startDate: Date, endDate: Date, fleetCompanyId?: string): Promise<number> {
//     const query = this.ticketRepository
//       .createQueryBuilder('ticket')
//       .select('AVG(TIMESTAMPDIFF(MINUTE, ticket.createdAt, ticket.resolvedAt))', 'avg')
//       .where('ticket.status = :status', { status: 'RESOLVED' })
//       .andWhere('ticket.resolvedAt BETWEEN :startDate AND :endDate', { startDate, endDate });

//     if (fleetCompanyId) {
//       query.andWhere('ticket.fleetCompanyId = :fleetCompanyId', { fleetCompanyId });
//     }

//     const result = await query.getRawOne();
//     return Math.round(parseFloat(result.avg) || 0);
//   }

//   private async getSatisfactionScore(startDate: Date, endDate: Date, fleetCompanyId?: string): Promise<number> {
//     const query = this.ticketRepository
//       .createQueryBuilder('ticket')
//       .select('AVG(ticket.satisfactionRating)', 'avg')
//       .where('ticket.satisfactionRating IS NOT NULL')
//       .andWhere('ticket.resolvedAt BETWEEN :startDate AND :endDate', { startDate, endDate });

//     if (fleetCompanyId) {
//       query.andWhere('ticket.fleetCompanyId = :fleetCompanyId', { fleetCompanyId });
//     }

//     const result = await query.getRawOne();
//     return Math.round((parseFloat(result.avg) || 0) * 100) / 100;
//   }

//   private async getTicketsByCategory(startDate: Date, endDate: Date, fleetCompanyId?: string): Promise<{ category: string; count: number }[]> {
//     const query = this.ticketRepository
//       .createQueryBuilder('ticket')
//       .select('ticket.category', 'category')
//       .addSelect('COUNT(ticket.id)', 'count')
//       .where('ticket.createdAt BETWEEN :startDate AND :endDate', { startDate, endDate })
//       .groupBy('ticket.category');

//     if (fleetCompanyId) {
//       query.andWhere('ticket.fleetCompanyId = :fleetCompanyId', { fleetCompanyId });
//     }

//     const results = await query.getRawMany();
//     return results.map((r) => ({ category: r.category, count: parseInt(r.count) }));
//   }

//   private async getTicketsByPriority(startDate: Date, endDate: Date, fleetCompanyId?: string): Promise<{ priority: string; count: number }[]> {
//     const query = this.ticketRepository
//       .createQueryBuilder('ticket')
//       .select('ticket.priority', 'priority')
//       .addSelect('COUNT(ticket.id)', 'count')
//       .where('ticket.createdAt BETWEEN :startDate AND :endDate', { startDate, endDate })
//       .groupBy('ticket.priority');

//     if (fleetCompanyId) {
//       query.andWhere('ticket.fleetCompanyId = :fleetCompanyId', { fleetCompanyId });
//     }

//     const results = await query.getRawMany();
//     return results.map((r) => ({ priority: r.priority, count: parseInt(r.count) }));
//   }

//   private async updateStatsCache(): Promise<void> {
//     // Invalidate cache to force refresh
//     const keys = await this.redisService.keys('support:stats:*');
//     for (const key of keys) {
//       await this.redisService.del(key);
//     }
//   }

//   async getCategories(): Promise<{ id: string; name: string; description: string }[]> {
//     return [
//       { id: 'BOOKING', name: 'Booking Issue', description: 'Problems with bookings, reservations, or cancellations' },
//       { id: 'PAYMENT', name: 'Payment Issue', description: 'Payment failures, refunds, or billing questions' },
//       { id: 'TRIP', name: 'Trip Issue', description: 'Issues during the trip, delays, or route problems' },
//       { id: 'VEHICLE', name: 'Vehicle Issue', description: 'Vehicle condition, cleanliness, or safety concerns' },
//       { id: 'DRIVER', name: 'Driver Issue', description: 'Driver behavior, professionalism, or safety concerns' },
//       { id: 'APP', name: 'App/Technical', description: 'App bugs, crashes, or technical difficulties' },
//       { id: 'ACCOUNT', name: 'Account Issue', description: 'Login problems, profile issues, or account management' },
//       { id: 'REFUND', name: 'Refund Request', description: 'Requesting refunds for cancelled or unsatisfactory services' },
//       { id: 'FEEDBACK', name: 'General Feedback', description: 'General suggestions, compliments, or complaints' },
//       { id: 'OTHER', name: 'Other', description: 'Issues that do not fit into other categories' },
//     ];
//   }

//   private mapToResponseDto(ticket: SupportTicket): TicketResponseDto {
//     return {
//       id: ticket.id,
//       ticketNumber: ticket.ticketNumber,
//       subject: ticket.subject,
//       description: ticket.description,
//       category: ticket.category,
//       priority: ticket.priority,
//       status: ticket.status,
//       user: ticket.user ? {
//         id: ticket.user.id,
//         name: ticket.user.name,
//         email: ticket.user.email,
//         phone: ticket.user.phone,
//       } : null,
//       assignedTo: ticket.assignedTo ? {
//         id: ticket.assignedTo.id,
//         name: ticket.assignedTo.name,
//       } : null,
//       comments: (ticket.comments || []).map((c: any) => ({
//         id: c.id,
//         message: c.message,
//         user: c.user ? {
//           id: c.user.id,
//           name: c.user.name,
//         } : null,
//         createdAt: c.createdAt,
//         isInternal: c.isInternal,
//       })),
//       resolution: ticket.resolution,
//       satisfactionRating: ticket.satisfactionRating,
//       createdAt: ticket.createdAt,
//       updatedAt: ticket.updatedAt,
//       resolvedAt: ticket.resolvedAt,
//       reopenedAt: ticket.reopenedAt,
//       escalationReason: ticket.escalationReason,
//       reopenReason: ticket.reopenReason,
//     };
//   }
// }





import * as crypto from 'crypto';
import {
  Injectable,
  Logger,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import {
  SupportTicket,
  TicketStatus,
  TicketPriority,
} from '../database/entities/support-ticket.entity';
import { RoleName } from '../database/entities/role.entity';
import { User } from '../database/entities/user.entity';
import { Notification } from '../database/entities/notification.entity';
import { NotificationsService } from '../notifications/notifications.service';
import { KafkaService } from '../kafka/kafka.service';
import { RedisService } from '../redis/redis.service';
import {
  CreateTicketDto,
  UpdateTicketDto,
  TicketResponseDto,
  TicketQueryDto,
  TicketStatsDto,
  AssignTicketDto,
  EscalateTicketDto,
} from './dto/support.dto';

@Injectable()
export class SupportService {
  private readonly logger = new Logger(SupportService.name);

  constructor(
    @InjectRepository(SupportTicket)
    private readonly ticketRepository: Repository<SupportTicket>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Notification)
    private readonly notificationRepository: Repository<Notification>,
    private readonly notificationsService: NotificationsService,
    private readonly kafkaService: KafkaService,
    private readonly redisService: RedisService,
  ) {}

  async createTicket(dto: CreateTicketDto, userId: string): Promise<TicketResponseDto> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    const ticketNumber = `TKT-${Date.now()}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`;

    const ticket = this.ticketRepository.create({
      ...dto,
      ticketNumber,
      user,
      status: TicketStatus.OPEN,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const saved = await this.ticketRepository.save(ticket);

    await this.notificationsService.sendToUser(userId, {
      title: 'Support Ticket Created',
      body: `Ticket #${saved.ticketNumber} has been created successfully. We'll get back to you soon.`,
      type: 'SUPPORT',
      data: { ticketId: saved.id, ticketNumber: saved.ticketNumber },
    });

    await this.kafkaService.publish('support.ticket.created', {
      ticketId: saved.id,
      ticketNumber: saved.ticketNumber,
      category: saved.category,
      priority: saved.priority,
      userId,
    });

    this.logger.log(`Ticket created: ${saved.ticketNumber} by user ${userId}`);
    return this.mapToResponseDto(saved);
  }

  async getTickets(
    query: TicketQueryDto,
    user: any,
  ): Promise<{ data: TicketResponseDto[]; total: number; page: number; limit: number }> {
    const { page = 1, limit = 20, status, priority, category, search, assignedToMe } = query;
    const skip = (page - 1) * limit;

    const qb = this.ticketRepository.createQueryBuilder('ticket')
      .leftJoinAndSelect('ticket.user', 'user')
      .leftJoinAndSelect('ticket.assignedTo', 'assignedTo')
      .orderBy('ticket.createdAt', 'DESC')
      .skip(skip)
      .take(limit);

    if (user.role === RoleName.PASSENGER || user.role === RoleName.DRIVER) {
      qb.andWhere('ticket.userId = :userId', { userId: user.userId });
    } else if ((user.role === RoleName.FLEET_MANAGER || user.role === RoleName.VEHICLE_OWNER) && user.fleetCompanyId) {
      qb.andWhere('ticket.fleetCompanyId = :fleetCompanyId', { fleetCompanyId: user.fleetCompanyId });
    }

    if (status) qb.andWhere('ticket.status = :status', { status });
    if (priority) qb.andWhere('ticket.priority = :priority', { priority });
    if (category) qb.andWhere('ticket.category = :category', { category });
    if (search) {
      qb.andWhere(
        '(ticket.subject LIKE :search OR ticket.description LIKE :search OR ticket.ticketNumber LIKE :search)',
        { search: `%${search}%` },
      );
    }
    if (assignedToMe) {
      qb.andWhere('ticket.assignedToId = :assignedToId', { assignedToId: user.userId });
    }

    const [tickets, total] = await qb.getManyAndCount();

    return {
      data: tickets.map((t) => this.mapToResponseDto(t)),
      total,
      page,
      limit,
    };
  }

  async getTicketById(id: string, user: any): Promise<TicketResponseDto> {
    const ticket = await this.ticketRepository.findOne({
      where: { id },
      relations: ['user', 'assignedTo'],
    });

    if (!ticket) throw new NotFoundException('Ticket not found');

    if (user.role === RoleName.PASSENGER || user.role === RoleName.DRIVER) {
      if (ticket.user.id !== user.userId) {
        throw new ForbiddenException('You can only view your own tickets');
      }
    } else if ((user.role === RoleName.FLEET_MANAGER || user.role === RoleName.VEHICLE_OWNER) && ticket.fleetCompanyId !== user.fleetCompanyId) {
      throw new ForbiddenException('You can only view tickets from your fleet company');
    }

    return this.mapToResponseDto(ticket);
  }

  async updateTicket(id: string, dto: UpdateTicketDto, user: any): Promise<TicketResponseDto> {
    const ticket = await this.ticketRepository.findOne({
      where: { id },
      relations: ['user'],
    });

    if (!ticket) throw new NotFoundException('Ticket not found');

    if ((user.role === RoleName.PASSENGER || user.role === RoleName.DRIVER) && ticket.status !== TicketStatus.OPEN) {
      throw new ForbiddenException('Cannot update ticket that is not open');
    }

    if ((user.role === RoleName.PASSENGER || user.role === RoleName.DRIVER) && ticket.user.id !== user.userId) {
      throw new ForbiddenException('You can only update your own tickets');
    }

    const updates: Partial<SupportTicket> = {
      ...dto,
      updatedAt: new Date(),
    };

    await this.ticketRepository.update(id, updates);
    const updated = await this.ticketRepository.findOne({
      where: { id },
      relations: ['user', 'assignedTo'],
    });

    return this.mapToResponseDto(updated);
  }

  async assignTicket(id: string, dto: AssignTicketDto, user: any): Promise<TicketResponseDto> {
    const ticket = await this.ticketRepository.findOne({
      where: { id },
      relations: ['user', 'assignedTo'],
    });

    if (!ticket) throw new NotFoundException('Ticket not found');

    const agent = await this.userRepository.findOne({ where: { id: dto.agentId } });
    if (!agent) throw new NotFoundException('Agent not found');

    ticket.assignedTo = agent;
    ticket.status = TicketStatus.IN_PROGRESS;
    ticket.updatedAt = new Date();

    const saved = await this.ticketRepository.save(ticket);

    await this.notificationsService.sendToUser(ticket.user.id, {
      title: 'Ticket Assigned',
      body: `Your ticket #${ticket.ticketNumber} has been assigned to an agent.`,
      type: 'SUPPORT',
      data: {
        ticketId: ticket.id,
        assignedTo: `${agent.firstName || ''} ${agent.lastName || ''}`.trim(),
      },
    });

    await this.notificationsService.sendToUser(dto.agentId, {
      title: 'New Ticket Assigned',
      body: `Ticket #${ticket.ticketNumber} has been assigned to you.`,
      type: 'SUPPORT',
      data: { ticketId: ticket.id },
    });

    this.logger.log(`Ticket ${ticket.ticketNumber} assigned to ${dto.agentId}`);
    return this.mapToResponseDto(saved);
  }

  async escalateTicket(id: string, dto: EscalateTicketDto, user: any): Promise<TicketResponseDto> {
    const ticket = await this.ticketRepository.findOne({
      where: { id },
      relations: ['user'],
    });

    if (!ticket) throw new NotFoundException('Ticket not found');

    const priorityOrder = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL', 'URGENT'];
    const currentIndex = priorityOrder.indexOf(ticket.priority);
    const newIndex = priorityOrder.indexOf(dto.newPriority);

    if (newIndex <= currentIndex) {
      throw new BadRequestException('New priority must be higher than current priority');
    }

    ticket.priority = dto.newPriority;
    ticket.escalationReason = dto.reason;
    ticket.escalatedAt = new Date();
    ticket.escalatedBy = user.userId;
    ticket.updatedAt = new Date();

    const saved = await this.ticketRepository.save(ticket);

    await this.kafkaService.publish('support.ticket.escalated', {
      ticketId: saved.id,
      ticketNumber: saved.ticketNumber,
      newPriority: saved.priority,
      reason: dto.reason,
      escalatedBy: user.userId,
    });

    this.logger.warn(`Ticket ${ticket.ticketNumber} escalated to ${dto.newPriority}`);
    return this.mapToResponseDto(saved);
  }

  async resolveTicket(id: string, resolution: string, user: any): Promise<TicketResponseDto> {
    const ticket = await this.ticketRepository.findOne({
      where: { id },
      relations: ['user', 'assignedTo'],
    });

    if (!ticket) throw new NotFoundException('Ticket not found');
    if (ticket.status === TicketStatus.RESOLVED || ticket.status === TicketStatus.CLOSED) {
      throw new BadRequestException('Ticket is already resolved');
    }

    ticket.status = TicketStatus.RESOLVED;
    ticket.resolution = resolution;
    ticket.resolvedAt = new Date();
    ticket.resolvedBy = user.userId;
    ticket.updatedAt = new Date();

    const saved = await this.ticketRepository.save(ticket);

    const resolutionTime = Math.round(
      (saved.resolvedAt.getTime() - saved.createdAt.getTime()) / (1000 * 60),
    );

    await this.notificationsService.sendToUser(ticket.user.id, {
      title: 'Ticket Resolved',
      body: `Your ticket #${ticket.ticketNumber} has been resolved.`,
      type: 'SUPPORT',
      data: { ticketId: ticket.id, resolution, resolutionTime },
    });

    await this.updateStatsCache();

    this.logger.log(`Ticket ${ticket.ticketNumber} resolved in ${resolutionTime} minutes`);
    return this.mapToResponseDto(saved);
  }

  async reopenTicket(id: string, reason: string, user: any): Promise<TicketResponseDto> {
    const ticket = await this.ticketRepository.findOne({
      where: { id },
      relations: ['user'],
    });

    if (!ticket) throw new NotFoundException('Ticket not found');
    if (ticket.status !== TicketStatus.RESOLVED && ticket.status !== TicketStatus.CLOSED) {
      throw new BadRequestException('Only resolved or closed tickets can be reopened');
    }

    ticket.status = TicketStatus.REOPENED;
    ticket.reopenReason = reason;
    ticket.reopenedAt = new Date();
    ticket.reopenedBy = user.userId;
    ticket.updatedAt = new Date();

    const saved = await this.ticketRepository.save(ticket);

    await this.notificationsService.sendToUser(ticket.user.id, {
      title: 'Ticket Reopened',
      body: `Your ticket #${ticket.ticketNumber} has been reopened.`,
      type: 'SUPPORT',
      data: { ticketId: ticket.id, reason },
    });

    return this.mapToResponseDto(saved);
  }

  async addComment(id: string, message: string, user: any): Promise<TicketResponseDto> {
    const ticket = await this.ticketRepository.findOne({
      where: { id },
      relations: ['user', 'assignedTo'],
    });

    if (!ticket) throw new NotFoundException('Ticket not found');

    if ((user.role === RoleName.PASSENGER || user.role === RoleName.DRIVER) && ticket.user.id !== user.userId) {
      throw new ForbiddenException('You can only add comments to your own tickets');
    }

    const comment = {
      id: crypto.randomUUID(),
      message,
      user: {
        id: user.userId,
        name: `${user.firstName || ''} ${user.lastName || ''}`.trim(),
        email: user.email,
      },
      createdAt: new Date(),
      isInternal: user.role === RoleName.PASSENGER || user.role === RoleName.DRIVER ? false : true,
    };

    ticket.comments = [...(ticket.comments || []), comment];
    ticket.updatedAt = new Date();

    const saved = await this.ticketRepository.save(ticket);

    const notifyUserId = ticket.user.id === user.userId && ticket.assignedTo
      ? ticket.assignedTo.id
      : ticket.user.id;

    await this.notificationsService.sendToUser(notifyUserId, {
      title: 'New Comment on Ticket',
      body: `New comment on ticket #${ticket.ticketNumber}`,
      type: 'SUPPORT',
      data: { ticketId: ticket.id, commentId: comment.id },
    });

    return this.mapToResponseDto(saved);
  }

  async deleteTicket(id: string, user: any): Promise<{ message: string }> {
    const ticket = await this.ticketRepository.findOne({ where: { id } });
    if (!ticket) throw new NotFoundException('Ticket not found');

    await this.ticketRepository.softDelete(id);
    this.logger.log(`Ticket ${id} deleted by ${user.userId}`);

    return { message: 'Ticket deleted successfully' };
  }

  async getStats(days: number, user: any): Promise<TicketStatsDto> {
    const cacheKey = `support:stats:${days}:${user.fleetCompanyId || 'all'}`;
    const cached = await this.redisService.get(cacheKey);
    if (cached) return JSON.parse(cached);

    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const baseWhere = user.fleetCompanyId ? { fleetCompanyId: user.fleetCompanyId } : {};

    const [
      totalTickets,
      openTickets,
      inProgressTickets,
      resolvedTickets,
      closedTickets,
      avgResolutionTime,
      satisfactionScore,
      ticketsByCategory,
      ticketsByPriority,
    ] = await Promise.all([
      this.ticketRepository.count({
        where: { createdAt: Between(startDate, endDate), ...baseWhere },
      }),
      this.ticketRepository.count({ where: { status: TicketStatus.OPEN, ...baseWhere } }),
      this.ticketRepository.count({ where: { status: TicketStatus.IN_PROGRESS, ...baseWhere } }),
      this.ticketRepository.count({ where: { status: TicketStatus.RESOLVED, ...baseWhere } }),
      this.ticketRepository.count({ where: { status: TicketStatus.CLOSED, ...baseWhere } }),
      this.getAverageResolutionTime(startDate, endDate, user.fleetCompanyId),
      this.getSatisfactionScore(startDate, endDate, user.fleetCompanyId),
      this.getTicketsByCategory(startDate, endDate, user.fleetCompanyId),
      this.getTicketsByPriority(startDate, endDate, user.fleetCompanyId),
    ]);

    const stats: TicketStatsDto = {
      totalTickets,
      openTickets,
      inProgressTickets,
      resolvedTickets,
      closedTickets,
      avgResolutionTime,
      satisfactionScore,
      ticketsByCategory,
      ticketsByPriority,
      period: { startDate, endDate, days },
    };

    await this.redisService.set(cacheKey, JSON.stringify(stats), 300);
    return stats;
  }

  private async getAverageResolutionTime(startDate: Date, endDate: Date, fleetCompanyId?: string): Promise<number> {
    const query = this.ticketRepository
      .createQueryBuilder('ticket')
      .select('AVG(EXTRACT(EPOCH FROM (ticket.resolvedAt - ticket.createdAt)) / 60)', 'avg')
      .where('ticket.status = :status', { status: 'RESOLVED' })
      .andWhere('ticket.resolvedAt BETWEEN :startDate AND :endDate', { startDate, endDate });

    if (fleetCompanyId) {
      query.andWhere('ticket.fleetCompanyId = :fleetCompanyId', { fleetCompanyId });
    }

    const result = await query.getRawOne();
    return Math.round(parseFloat(result.avg) || 0);
  }

  private async getSatisfactionScore(startDate: Date, endDate: Date, fleetCompanyId?: string): Promise<number> {
    const query = this.ticketRepository
      .createQueryBuilder('ticket')
      .select('AVG(ticket.satisfactionRating)', 'avg')
      .where('ticket.satisfactionRating IS NOT NULL')
      .andWhere('ticket.resolvedAt BETWEEN :startDate AND :endDate', { startDate, endDate });

    if (fleetCompanyId) {
      query.andWhere('ticket.fleetCompanyId = :fleetCompanyId', { fleetCompanyId });
    }

    const result = await query.getRawOne();
    return Math.round((parseFloat(result.avg) || 0) * 100) / 100;
  }

  private async getTicketsByCategory(startDate: Date, endDate: Date, fleetCompanyId?: string): Promise<{ category: string; count: number }[]> {
    const query = this.ticketRepository
      .createQueryBuilder('ticket')
      .select('ticket.category', 'category')
      .addSelect('COUNT(ticket.id)', 'count')
      .where('ticket.createdAt BETWEEN :startDate AND :endDate', { startDate, endDate })
      .groupBy('ticket.category');

    if (fleetCompanyId) {
      query.andWhere('ticket.fleetCompanyId = :fleetCompanyId', { fleetCompanyId });
    }

    const results = await query.getRawMany();
    return results.map((r) => ({ category: r.category, count: parseInt(r.count) }));
  }

  private async getTicketsByPriority(startDate: Date, endDate: Date, fleetCompanyId?: string): Promise<{ priority: string; count: number }[]> {
    const query = this.ticketRepository
      .createQueryBuilder('ticket')
      .select('ticket.priority', 'priority')
      .addSelect('COUNT(ticket.id)', 'count')
      .where('ticket.createdAt BETWEEN :startDate AND :endDate', { startDate, endDate })
      .groupBy('ticket.priority');

    if (fleetCompanyId) {
      query.andWhere('ticket.fleetCompanyId = :fleetCompanyId', { fleetCompanyId });
    }

    const results = await query.getRawMany();
    return results.map((r) => ({ priority: r.priority, count: parseInt(r.count) }));
  }

  private async updateStatsCache(): Promise<void> {
    const keys = await this.redisService.keys('support:stats:*');
    for (const key of keys) {
      await this.redisService.del(key);
    }
  }

  async getCategories(): Promise<{ id: string; name: string; description: string }[]> {
    return [
      { id: 'BOOKING', name: 'Booking Issue', description: 'Problems with bookings, reservations, or cancellations' },
      { id: 'PAYMENT', name: 'Payment Issue', description: 'Payment failures, refunds, or billing questions' },
      { id: 'TRIP', name: 'Trip Issue', description: 'Issues during the trip, delays, or route problems' },
      { id: 'VEHICLE', name: 'Vehicle Issue', description: 'Vehicle condition, cleanliness, or safety concerns' },
      { id: 'DRIVER', name: 'Driver Issue', description: 'Driver behavior, professionalism, or safety concerns' },
      { id: 'APP', name: 'App/Technical', description: 'App bugs, crashes, or technical difficulties' },
      { id: 'ACCOUNT', name: 'Account Issue', description: 'Login problems, profile issues, or account management' },
      { id: 'REFUND', name: 'Refund Request', description: 'Requesting refunds for cancelled or unsatisfactory services' },
      { id: 'FEEDBACK', name: 'General Feedback', description: 'General suggestions, compliments, or complaints' },
      { id: 'OTHER', name: 'Other', description: 'Issues that do not fit into other categories' },
    ];
  }

  private mapToResponseDto(ticket: SupportTicket): TicketResponseDto {
    return {
      id: ticket.id,
      ticketNumber: ticket.ticketNumber,
      subject: ticket.subject,
      description: ticket.description,
      category: ticket.category,
      priority: ticket.priority,
      status: ticket.status,
      user: ticket.user ? {
        id: ticket.user.id,
        name: `${ticket.user.firstName || ''} ${ticket.user.lastName || ''}`.trim(),
        email: ticket.user.email,
        phone: ticket.user.phone,
      } : null,
      assignedTo: ticket.assignedTo ? {
        id: ticket.assignedTo.id,
        name: `${ticket.assignedTo.firstName || ''} ${ticket.assignedTo.lastName || ''}`.trim(),
      } : null,
      comments: (ticket.comments || []).map((c: any) => ({
        id: c.id,
        message: c.message,
        user: c.user ? {
          id: c.user.id,
          name: c.user.name,
        } : null,
        createdAt: c.createdAt,
        isInternal: c.isInternal,
      })),
      resolution: ticket.resolution,
      satisfactionRating: ticket.satisfactionRating,
      createdAt: ticket.createdAt,
      updatedAt: ticket.updatedAt,
      resolvedAt: ticket.resolvedAt,
      reopenedAt: ticket.reopenedAt,
      escalationReason: ticket.escalationReason,
      reopenReason: ticket.reopenReason,
    };
  }
}