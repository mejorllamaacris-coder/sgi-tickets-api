import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { HistorialService } from '../historial/historial.service.js';
import { CrearComentarioDto } from './dto/crear-comentario.dto.js';

@Injectable()
export class ComentariosService {
  constructor(
    private prisma: PrismaService,
    private historialService: HistorialService,
  ) {}

  async crearComentario(dto: CrearComentarioDto, id_usuario: number) {
    // 1. Validar que el ticket exista
    const ticket = await this.prisma.pd_tickets.findUnique({ where: { id: dto.id_ticket } });
    if (!ticket) throw new NotFoundException('El ticket no existe');

    // 2. Si es respuesta, validar que el comentario padre exista y sea del mismo ticket
    if (dto.id_padre) {
      const padre = await this.prisma.pd_comentarios.findUnique({ where: { id: dto.id_padre } });
      if (!padre || padre.id_ticket !== dto.id_ticket) {
        throw new BadRequestException('El comentario padre no existe o no pertenece a este ticket');
      }
    }

    // 3. Crear el comentario
    const comentario = await this.prisma.pd_comentarios.create({
      data: {
        id_ticket: dto.id_ticket,
        id_usuario,
        contenido: dto.contenido.trim(),
        es_interno: dto.es_interno || false,
        id_padre: dto.id_padre || null,
      },
    });

    // 4. Registrar en el historial del ticket
    await this.historialService.registrarAccion(
      dto.id_ticket,
      id_usuario,
      'comentario',
      dto.es_interno ? 'Comentario interno agregado' : 'Comentario agregado'
    );

    return this.obtenerComentarioConAutor(comentario.id);
  }

  async obtenerComentariosPorTicket(id_ticket: number) {
    const comentarios = await this.prisma.pd_comentarios.findMany({
      where: { id_ticket },
      orderBy: { fecha_creacion: 'asc' },
    });

    if (comentarios.length === 0) return [];

    // Join en memoria para obtener nombres (patrón probado)
    const userIds = [...new Set(comentarios.map(c => c.id_usuario))];
    const usuarios = await this.prisma.usuarios.findMany({
      where: { id: { in: userIds } },
      select: { id: true, nombre: true, email: true },
    });

    const userMap = new Map(usuarios.map(u => [u.id, u]));

    return comentarios.map(c => ({
      id: c.id,
      id_usuario: c.id_usuario,
      usuario_nombre: userMap.get(c.id_usuario)?.nombre || 'Desconocido',
      contenido: c.contenido,
      es_interno: c.es_interno,
      id_padre: c.id_padre,
      fecha_creacion: c.fecha_creacion,
    }));
  }

  private async obtenerComentarioConAutor(id: number) {
    const c = await this.prisma.pd_comentarios.findUnique({ where: { id } });
    if (!c) return null;
    
    const u = await this.prisma.usuarios.findUnique({ 
      where: { id: c.id_usuario }, 
      select: { id: true, nombre: true, email: true } 
    });

    return {
      id: c.id,
      id_usuario: c.id_usuario,
      usuario_nombre: u?.nombre || 'Desconocido',
      contenido: c.contenido,
      es_interno: c.es_interno,
      id_padre: c.id_padre,
      fecha_creacion: c.fecha_creacion,
    };
  }
}
