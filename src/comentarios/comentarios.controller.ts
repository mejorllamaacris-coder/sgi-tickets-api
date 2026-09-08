import { Controller, Get, Post, Body, UseGuards, Request, Param, ParseIntPipe } from '@nestjs/common';
import { ComentariosService } from './comentarios.service.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { CrearComentarioDto } from './dto/crear-comentario.dto.js';

@Controller('comentarios')
export class ComentariosController {
  constructor(private readonly comentariosService: ComentariosService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  async crearComentario(@Body() dto: CrearComentarioDto, @Request() req: any) {
    return this.comentariosService.crearComentario(dto, req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Get('ticket/:id')
  async obtenerComentarios(@Param('id', ParseIntPipe) id: number) {
    return this.comentariosService.obtenerComentariosPorTicket(id);
  }
}
