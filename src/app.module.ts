import { Module } from '@nestjs/common';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { PrismaModule } from './prisma/prisma.module.js';
import { TicketsModule } from './tickets/tickets.module.js';
import { AuthModule } from './auth/auth.module.js';
import { HistorialModule } from './historial/historial.module.js';
import { ComentariosModule } from './comentarios/comentarios.module.js';
import { TablerosModule } from './tableros/tableros.module.js';

@Module({
  imports: [PrismaModule, AuthModule, HistorialModule, TicketsModule, ComentariosModule, TablerosModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
