import { Controller, Get, Patch, Param, Body, UseGuards, Request, ParseIntPipe } from '@nestjs/common';
import { TablerosService } from './tableros.service.js';
import { TicketsService } from '../tickets/tickets.service.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';

@Controller('tableros')
export class TablerosController {
  constructor(
    private readonly tablerosService: TablerosService,
    private readonly ticketsService: TicketsService,
  ) {}

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  async getTablero(@Param('id', ParseIntPipe) id: number) {
    return this.tablerosService.getTableroConListas(id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('tickets/:id/mover')
  async moverTicket(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { id_lista: number; id_estado?: number },
    @Request() req: any
  ) {
    return this.ticketsService.moverTicket(id, body.id_lista, body.id_estado, req.user.id);
  }
}
