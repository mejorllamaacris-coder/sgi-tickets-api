import { Module } from '@nestjs/common';
import { TicketsController } from './tickets.controller.js';
import { TicketsService } from './tickets.service.js';
import { AuthModule } from '../auth/auth.module.js';
import { VisibilidadService } from '../common/visibilidad.service.js';

@Module({
  imports: [AuthModule],
  controllers: [TicketsController],
  providers: [TicketsService, VisibilidadService],
  exports: [TicketsService],
})
export class TicketsModule {}
