import { Controller, Get, Post, Patch, Body, UseGuards, Request, Param, ParseIntPipe } from '@nestjs/common';
import { TicketsService } from './tickets.service.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { ActualizarTicketDto } from './dto/actualizar-ticket.dto.js';

@Controller('tickets')
export class TicketsController {
  constructor(private readonly ticketsService: TicketsService) {}

  @UseGuards(JwtAuthGuard)
  @Get('areas')
  async getAreas() {
    return this.ticketsService.getAreas();
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  async getTickets() {
    return this.ticketsService.getTickets();
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  async createTicket(@Body() body: any, @Request() req: any) {
    return this.ticketsService.createTicket({ ...body, id_creador: req.user.id });
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  async updateTicket(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: ActualizarTicketDto,
    @Request() req: any
  ) {
    return this.ticketsService.updateTicket(id, updateDto, req.user.id);
  }

  // NUEVO: Endpoint para ver el historial
  @UseGuards(JwtAuthGuard)
  @Get(':id/historial')
  async getHistorial(@Param('id', ParseIntPipe) id: number) {
    return this.ticketsService.getHistorial(id);
  }
}
