import { z } from 'zod';
import { TicketCategory, TicketPriority } from '@/types/support';

export const createTicketSchema = z.object({
  subject: z.string().min(5).max(200),
  description: z.string().min(10).max(5000),
  category: z.nativeEnum(TicketCategory),
  priority: z.nativeEnum(TicketPriority).optional(),
  bookingId: z.string().uuid().optional(),
  tripId: z.string().uuid().optional(),
  fleetCompanyId: z.string().uuid().optional(),
});

export type CreateTicketFormData = z.infer<typeof createTicketSchema>;

export const updateTicketSchema = z.object({
  subject: z.string().min(5).max(200).optional(),
  description: z.string().min(10).max(5000).optional(),
  category: z.nativeEnum(TicketCategory).optional(),
  priority: z.nativeEnum(TicketPriority).optional(),
  resolution: z.string().min(10).max(5000).optional(),
  satisfactionRating: z.number().int().min(1).max(5).optional(),
});

export type UpdateTicketFormData = z.infer<typeof updateTicketSchema>;

export const assignTicketSchema = z.object({
  agentId: z.string().uuid(),
  note: z.string().max(5000).optional(),
});

export type AssignTicketFormData = z.infer<typeof assignTicketSchema>;

export const escalateTicketSchema = z.object({
  newPriority: z.nativeEnum(TicketPriority),
  reason: z.string().min(10).max(5000),
});

export type EscalateTicketFormData = z.infer<typeof escalateTicketSchema>;

export const addCommentSchema = z.object({
  message: z.string().min(1).max(5000),
  isInternal: z.boolean().optional(),
});

export type AddCommentFormData = z.infer<typeof addCommentSchema>;
