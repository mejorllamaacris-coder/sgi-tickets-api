import {
  Controller, Get, Post, Body, Patch, Param,
  UseGuards, Request, BadRequestException, Query, ParseIntPipe,
} from "@nestjs/common";
import { TicketsService } from "./tickets.service.js";
import { CrearTicketDto } from "./dto/crear-ticket.dto.js";
import { ActualizarTicketDto } from "./dto/actualizar-ticket.dto.js";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard.js";

@Controller("tickets")
@UseGuards(JwtAuthGuard)
export class TicketsController {
  constructor(private readonly ticketsService: TicketsService) {}

  @Get("areas")
  getAreas() { return this.ticketsService.getAreas(); }

  @Get("estados")
  getEstados() { return this.ticketsService.getEstados(); }

  @Get("complejidades")
  getComplejidades() { return this.ticketsService.getComplejidades(); }

  @Get("categorias")
  getCategorias(@Query("id_area") idArea?: string) {
    return this.ticketsService.getCategorias(idArea ? +idArea : undefined);
  }

  @Get("asignables")
  getAsignables(@Query("area", ParseIntPipe) idArea: number) {
    return this.ticketsService.getAsignables(idArea);
  }

  @Get()
  getTickets(@Query() query: any, @Request() req: any) {
    return this.ticketsService.getTicketsFiltrados(query, req.user);
  }

  @Get(":id")
  getTicketById(@Param("id") id: string, @Request() req: any) {
    const numId = +id;
    if (isNaN(numId)) throw new BadRequestException("ID invalido");
    return this.ticketsService.getTicketById(numId, req.user);
  }

  @Get(":id/historial")
  getHistorial(@Param("id") id: string) {
    return this.ticketsService.getHistorial(+id);
  }

  @Post()
  create(@Body() dto: CrearTicketDto, @Request() req: any) {
    return this.ticketsService.createTicket({ ...dto, id_creador: req.user.id });
  }

  @Patch(":id")
  update(@Param("id") id: string, @Body() dto: ActualizarTicketDto, @Request() req: any) {
    const numId = +id;
    if (isNaN(numId)) throw new BadRequestException("ID invalido");
    return this.ticketsService.updateTicket(numId, dto, req.user);
  }

  @Patch(":id/estado")
  cambiarEstado(@Param("id") id: string, @Body() body: any, @Request() req: any) {
    return this.ticketsService.cambiarEstado(+id, body.id_estado, req.user);
  }

  @Patch(":id/asignar")
  asignar(@Param("id") id: string, @Body() body: any, @Request() req: any) {
    return this.ticketsService.asignarTicket(+id, body.id_asignado, req.user);
  }

  @Patch(":id/eliminar")
  eliminar(@Param("id") id: string, @Request() req: any) {
    return this.ticketsService.eliminarTicket(+id, req.user);
  }

  @Post(":id/promover")
  promover(@Param("id") id: string, @Request() req: any) {
    return this.ticketsService.promoverTicket(+id, req.user);
  }

  @Patch("tickets/:id_ticket/mover")
  mover(@Param("id_ticket") id: string, @Body() body: any, @Request() req: any) {
    return this.ticketsService.moverTicket(+id, body.id_lista, body.id_estado, req.user.id);
  }
}
