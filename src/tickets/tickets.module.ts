import { Module } from '@nestjs/common';
import { TicketsController } from './tickets.controller.js';
import { TicketsService } from './tickets.service.js';
import { AuthModule } from '../auth/auth.module.js';

@Module({
  imports: [AuthModule],
  controllers: [TicketsController],
  providers: [TicketsService],
  exports: [TicketsService], // <-- Esto permite que TablerosModule lo use
})
export class TicketsModule {}
