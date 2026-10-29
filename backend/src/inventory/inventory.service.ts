import { Injectable, Logger } from '@nestjs/common';
import { RedisService } from '../redis/redis.service';

@Injectable()
export class InventoryService {
  private readonly logger = new Logger(InventoryService.name);

  constructor(private readonly redisService: RedisService) {}

  /**
   * Atomically reserve multiple seats using Redis SET NX.
   * If any seat is already reserved or sold, rolls back the reservation for all requested seats.
   */
  async reserveSeats(
    tripId: string,
    seatNumbers: string[],
    bookingId: string,
    ttlSeconds = 900,
  ): Promise<boolean> {
    const client = this.redisService.getClient();
    const acquiredKeys: string[] = [];

    for (const seatNumber of seatNumbers) {
      const key = `inventory:trip:${tripId}:seat:${seatNumber}`;
      const result = await client.set(key, `reserved:${bookingId}`, 'EX', ttlSeconds, 'NX');
      
      if (result === 'OK') {
        acquiredKeys.push(key);
      } else {
        // Rollback already acquired seats to prevent deadlock/partial booking leaks
        if (acquiredKeys.length > 0) {
          await client.del(...acquiredKeys);
        }
        return false;
      }
    }
    return true;
  }

  /**
   * Confirms seats as sold (permanent lock, no TTL).
   */
  async confirmSeats(tripId: string, seatNumbers: string[], bookingId: string): Promise<void> {
    const client = this.redisService.getClient();
    for (const seatNumber of seatNumbers) {
      const key = `inventory:trip:${tripId}:seat:${seatNumber}`;
      await client.set(key, `sold:${bookingId}`);
    }
  }

  /**
   * Release reserved/sold seats.
   */
  async releaseSeats(tripId: string, seatNumbers: string[]): Promise<void> {
    const client = this.redisService.getClient();
    const keys = seatNumbers.map((sn) => `inventory:trip:${tripId}:seat:${sn}`);
    if (keys.length > 0) {
      await client.del(...keys);
    }
  }

  /**
   * Query seat status instantly from Redis.
   */
  async getSeatStatus(tripId: string, seatNumber: string): Promise<string> {
    const key = `inventory:trip:${tripId}:seat:${seatNumber}`;
    const value = await this.redisService.get(key);
    
    if (!value) return 'available';
    if (value.startsWith('reserved:')) return 'reserved';
    if (value.startsWith('sold:')) return 'sold';
    return 'unknown';
  }

  /**
   * Rebuilds/syncs Redis inventory state from DB data.
   */
  async syncInventory(
    tripId: string,
    seats: { seatNumber: string; status: string; bookingId?: string }[],
  ): Promise<void> {
    const client = this.redisService.getClient();
    for (const seat of seats) {
      const key = `inventory:trip:${tripId}:seat:${seat.seatNumber}`;
      if (seat.status === 'sold' || seat.status === 'BOOKED') {
        await client.set(key, `sold:${seat.bookingId || 'unknown'}`);
      } else if (seat.status === 'reserved' || seat.status === 'RESERVED') {
        await client.set(key, `reserved:${seat.bookingId || 'unknown'}`, 'EX', 900);
      } else {
        await client.del(key);
      }
    }
  }
}
