import { Module, Global } from '@nestjs/common';
import { WebsocketGateway } from './websocket.gateway';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule } from '@nestjs/config';
import { RedisModule } from '../redis/redis.module';

@Global()
@Module({
  imports: [
    JwtModule,
    ConfigModule,
    RedisModule,
  ],
  providers: [WebsocketGateway],
  exports: [WebsocketGateway],
})
export class WebsocketModule {}