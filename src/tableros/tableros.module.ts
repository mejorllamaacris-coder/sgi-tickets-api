import { Module } from '@nestjs/common';
import { TablerosController } from './tableros.controller.js';
import { TablerosService } from './tableros.service.js';
import { TicketsModule } from '../tickets/tickets.module.js';
import { AuthModule } from '../auth/auth.module.js';

@Module({
  imports: [AuthModule, TicketsModule],
  controllers: [TablerosController],
  providers: [TablerosService],
})
export class TablerosModule {}
