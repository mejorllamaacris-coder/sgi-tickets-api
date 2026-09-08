import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { HistorialService } from '../historial/historial.service.js';
import { CrearTicketDto } from './dto/crear-ticket.dto.js';
import { ActualizarTicketDto } from './dto/actualizar-ticket.dto.js';
import { generarCodigoTicket, calcularFechaLimite } from './helpers/ticket.helpers.js';

@Injectable()
export class TicketsService {
  constructor(
    private prisma: PrismaService,
    private historialService: HistorialService,
  ) {}

  async getAreas() {
    return this.prisma.areas.findMany({ where: { activo: true }, orderBy: { nombre: 'asc' } });
  }

  async getTickets() {
    return this.prisma.pd_tickets.findMany({
      include: {
        area: true, estado: true, complejidad: true,
        usuario_creador: { select: { id: true, nombre: true, email: true } },
        usuario_asignado: { select: { id: true, nombre: true, email: true } },
      },
      orderBy: { fecha_creacion: 'desc' },
    });
  }

  async createTicket(data: CrearTicketDto & { id_creador: number }) {
    if (data.id_categoria) {
      const cat = await this.prisma.pd_categorias.findUnique({ where: { id: data.id_categoria } });
      if (!cat || !cat.activo) throw new BadRequestException('La categoría no existe o está inactiva');
      if (cat.id_area !== data.id_area) throw new BadRequestException('La categoría no pertenece al área');
    }
    const complejidad = await this.prisma.pd_complejidades.findUnique({ where: { id: data.id_complejidad } });
    if (!complejidad) throw new BadRequestException('La complejidad no existe');
    const estadoAbierto = await this.prisma.pd_estados.findFirst({ where: { nombre: 'Abierto' } });
    if (!estadoAbierto) throw new BadRequestException('Estado "Abierto" no configurado');

    const year = new Date().getFullYear();
    const count = await this.prisma.pd_tickets.count({ where: { codigo: { startsWith: `TK-${year}-` } } });
    
    return this.prisma.$transaction(async (tx) => {
      const ticket = await tx.pd_tickets.create({
        data: {
          codigo: generarCodigoTicket(year, count),
          titulo: data.titulo, descripcion: data.descripcion || null, tipo: 'soporte',
          id_area: data.id_area, id_estado: estadoAbierto.id, id_complejidad: data.id_complejidad,
          id_categoria: data.id_categoria || null, id_asignado: data.id_asignado || null,
          id_creador: data.id_creador, fecha_limite: calcularFechaLimite(complejidad.horas_estimadas, data.fecha_limite),
        },
        include: { area: true, estado: true, complejidad: true, usuario_creador: { select: { id: true, nombre: true, email: true } } },
      });
      await this.historialService.registrarAccion(ticket.id, data.id_creador, 'creado', 'Ticket creado', tx);
      return ticket;
    });
  }

  async updateTicket(id: number, data: ActualizarTicketDto, id_usuario: number) {
    const actual = await this.prisma.pd_tickets.findUnique({
      where: { id }, include: { estado: true, usuario_asignado: true, complejidad: true, categoria: true },
    });
    if (!actual) throw new NotFoundException(`Ticket ${id} no existe`);

    const cambios: string[] = [];
    const updateData: any = {};

    if (data.titulo && data.titulo !== actual.titulo) {
      updateData.titulo = data.titulo; cambios.push(`Título: "${actual.titulo}" → "${data.titulo}"`);
    }
    if (data.descripcion !== undefined && data.descripcion !== actual.descripcion) {
      updateData.descripcion = data.descripcion; cambios.push('Descripción actualizada');
    }
    if (data.id_estado && data.id_estado !== actual.id_estado) {
      const nuevo = await this.prisma.pd_estados.findUnique({ where: { id: data.id_estado } });
      if (!nuevo) throw new BadRequestException('Estado no existe');
      updateData.id_estado = data.id_estado; cambios.push(`Estado: "${actual.estado.nombre}" → "${nuevo.nombre}"`);
    }
    if (data.id_asignado !== undefined && data.id_asignado !== actual.id_asignado) {
      const nombreAnt = actual.usuario_asignado ? actual.usuario_asignado.nombre : 'Sin asignar';
      let nombreNuevo = 'Sin asignar';
      if (data.id_asignado) {
        const u = await this.prisma.usuarios.findUnique({ where: { id: data.id_asignado } });
        nombreNuevo = u ? u.nombre : 'Desconocido';
      }
      updateData.id_asignado = data.id_asignado; cambios.push(`Asignado: "${nombreAnt}" → "${nombreNuevo}"`);
    }
    if (data.id_complejidad && data.id_complejidad !== actual.id_complejidad) {
      const nueva = await this.prisma.pd_complejidades.findUnique({ where: { id: data.id_complejidad } });
      if (!nueva) throw new BadRequestException('Complejidad no existe');
      updateData.id_complejidad = data.id_complejidad;
      if (!data.fecha_limite) updateData.fecha_limite = calcularFechaLimite(nueva.horas_estimadas);
      cambios.push(`Complejidad: "${actual.complejidad.nombre}" → "${nueva.nombre}"`);
    }
    if (data.id_categoria !== undefined && data.id_categoria !== actual.id_categoria) {
      updateData.id_categoria = data.id_categoria;
      const catAnt = actual.categoria ? actual.categoria.nombre : 'Sin categoría';
      let catNueva = 'Sin categoría';
      if (data.id_categoria) {
        const c = await this.prisma.pd_categorias.findUnique({ where: { id: data.id_categoria } });
        catNueva = c ? c.nombre : 'Desconocida';
      }
      cambios.push(`Categoría: "${catAnt}" → "${catNueva}"`);
    }
    if (data.fecha_limite) {
      updateData.fecha_limite = new Date(data.fecha_limite); cambios.push('Fecha límite actualizada');
    }

    if (Object.keys(updateData).length === 0) throw new BadRequestException('No hay cambios');

    return this.prisma.$transaction(async (tx) => {
      const actualizado = await tx.pd_tickets.update({
        where: { id }, data: updateData,
        include: { area: true, estado: true, complejidad: true, usuario_creador: { select: { id: true, nombre: true, email: true } }, usuario_asignado: { select: { id: true, nombre: true, email: true } } },
      });
      await this.historialService.registrarAccion(id, id_usuario, 'actualizado', cambios.join(' | '), tx);
      return actualizado;
    });
  }

  // ✅ CORREGIDO: Join en memoria para obtener nombres sin necesitar relación en Prisma
  async getHistorial(id: number) {
    const historial = await this.prisma.pd_historial.findMany({
      where: { id_ticket: id },
      orderBy: { fecha_creacion: 'desc' },
    });

    if (historial.length === 0) return [];

    // 1. Sacar los IDs únicos de usuarios
    const userIds = [...new Set(historial.map(h => h.id_usuario))];
    
    // 2. Consultar esos usuarios en una sola query
    const usuarios = await this.prisma.usuarios.findMany({
      where: { id: { in: userIds } },
      select: { id: true, nombre: true, email: true }
    });

    // 3. Crear un mapa para búsqueda rápida O(1)
    const userMap = new Map(usuarios.map(u => [u.id, u]));

    // 4. Unir los datos
    return historial.map(h => ({
      id: h.id,
      id_usuario: h.id_usuario,
      usuario_nombre: userMap.get(h.id_usuario)?.nombre || 'Desconocido',
      accion: h.accion,
      detalle: h.detalle,
      fecha_creacion: h.fecha_creacion,
    }));
  }

  async moverTicket(id: number, id_lista: number, id_estado?: number, id_usuario?: number) {
    const actual = await this.prisma.pd_tickets.findUnique({
      where: { id }, include: { lista: true, estado: true },
    });
    if (!actual) throw new NotFoundException(`Ticket ${id} no existe`);

    const cambios: string[] = [];
    const updateData: any = { id_lista };

    const nuevaLista = await this.prisma.pd_listas.findUnique({ where: { id: id_lista } });
    if (!nuevaLista) throw new BadRequestException('La lista de destino no existe');
    
    if (!actual.lista || actual.lista.id !== id_lista) {
      cambios.push(`Lista: "${actual.lista?.nombre || 'Sin lista'}" → "${nuevaLista.nombre}"`);
    }

    if (id_estado && id_estado !== actual.id_estado) {
      const nuevoEstado = await this.prisma.pd_estados.findUnique({ where: { id: id_estado } });
      if (!nuevoEstado) throw new BadRequestException('El estado no existe');
      updateData.id_estado = id_estado;
      cambios.push(`Estado: "${actual.estado.nombre}" → "${nuevoEstado.nombre}"`);
    }

    if (cambios.length === 0) throw new BadRequestException('No hay cambios para mover');

    return this.prisma.$transaction(async (tx) => {
      const actualizado = await tx.pd_tickets.update({
        where: { id }, data: updateData,
        include: { area: true, estado: true, complejidad: true, lista: true, usuario_creador: { select: { id: true, nombre: true } }, usuario_asignado: { select: { id: true, nombre: true } } },
      });

      if (id_usuario) {
        await this.historialService.registrarAccion(id, id_usuario, 'movido', cambios.join(' | '), tx);
      }

      return actualizado;
    });
  }
}
