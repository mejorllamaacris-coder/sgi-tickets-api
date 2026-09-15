import { Controller, Get, Post, Patch, Param, Query, Body, UseGuards, Request } from "@nestjs/common";
import { TablerosService } from "./tableros.service.js";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard.js";

@Controller("tableros")
@UseGuards(JwtAuthGuard)
export class TablerosController {
  constructor(private readonly tablerosService: TablerosService) {}

  @Get()
  findAll(@Query("areas") areas?: string) {
    const idAreas = areas ? areas.split(",").map(Number) : undefined;
    return this.tablerosService.findAll(idAreas);
  }

  @Post()
  crear(@Body() body: any, @Request() req: any) {
    return this.tablerosService.crear(body, req.user.sub);
  }

  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.tablerosService.findOne(+id);
  }

  @Patch(":id/desactivar")
  desactivar(@Param("id") id: string) {
    return this.tablerosService.desactivar(+id);
  }

  @Patch(":id/listas/reorder")
  reordenarListas(@Param("id") id: string, @Body() movimientos: any[]) {
    return this.tablerosService.reordenarListas(+id, movimientos);
  }

  @Patch("tickets/:id_ticket/mover")
  moverTicket(@Param("id_ticket") idTicket: string, @Body() body: any, @Request() req: any) {
    return this.tablerosService.moverTicket(+idTicket, body.id_lista, req.user.sub);
  }
}
