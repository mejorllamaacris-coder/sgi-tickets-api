import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { CrearTicketDto } from './dto/crear-ticket.dto.js';
import { HistorialService } from '../historial/historial.service.js';
import { VisibilidadService } from '../common/visibilidad.service.js';

@Injectable()
export class TicketsService {
  constructor(
    private prisma: PrismaService,
    private historialService: HistorialService,
    private visibilidad: VisibilidadService,
  ) {}

  async getAreas() {
    return this.prisma.areas.findMany({
      where: { activo: true },
      orderBy: { nombre: 'asc' },
    });
  }

  async getEstados() {
    return this.prisma.pd_estados.findMany({ orderBy: { id: 'asc' } });
  }

  async getComplejidades() {
    return this.prisma.pd_complejidades.findMany({
      where: { activo: true },
      orderBy: { nombre: 'asc' },
    });
  }

  async getTicketById(id: number, user: any) {
    const ticket = await this.prisma.pd_tickets.findUnique({
      where: { id },
      include: {
        area: true,
        estado: true,
        complejidad: true,
        categoria: true,
        lista: true,
        usuario_creador: { select: { id: true, nombre: true, email: true } },
        usuario_asignado: { select: { id: true, nombre: true, email: true } },
      },
    });
    if (!ticket) throw new NotFoundException('Ticket no encontrado');
    const permiso = this.visibilidad.fromRequest(user);
    this.visibilidad.assertPuedeVer(ticket, permiso);
    return ticket;
  }

  async createTicket(data: CrearTicketDto & { id_creador: number }) {
    return this.prisma.$transaction(async (tx: any) => {
      let tipo = 'soporte';
      if (data.id_categoria) {
        const cat = await tx.pd_categorias.findUnique({ where: { id: data.id_categoria }, select: { tipo_ticket: true } });
        tipo = cat?.tipo_ticket || 'soporte';
      }
      const creador = await tx.usuarios.findUnique({ where: { id: data.id_creador }, select: { id_area: true } });
      const id_area_origen = (creador?.id_area && creador.id_area !== data.id_area) ? creador.id_area : null;

      const ticket = await tx.pd_tickets.create({
        data: {
          titulo: data.titulo,
          descripcion: data.descripcion,
          id_area: data.id_area,
          id_complejidad: data.id_complejidad,
          id_categoria: data.id_categoria,
          id_asignado: data.id_asignado,
          id_estado: 1,
          id_creador: data.id_creador,
          id_area_origen,
          tipo,
        },
        include: {
          area: true, estado: true, complejidad: true, categoria: true, lista: true,
          usuario_creador: { select: { id: true, nombre: true, email: true } },
          usuario_asignado: { select: { id: true, nombre: true, email: true } },
        },
      });
      await this.historialService.registrarAccion(ticket.id, data.id_creador, 'creado', `Ticket "${data.titulo}" creado`, tx);
      return ticket;
    });
  }

  async updateTicket(id: number, data: any, user: any) {
    const ticket: any = await this.prisma.pd_tickets.findUnique({ where: { id } });
    if (!ticket) throw new NotFoundException('Ticket no encontrado');
    const permiso = this.visibilidad.fromRequest(user);
    this.visibilidad.assertPuedeModificar(ticket, permiso);

    return this.prisma.$transaction(async (tx: any) => {
      const updateData: any = {};
      const cambios: string[] = [];
      const allowedFields = ['titulo', 'descripcion', 'id_area', 'id_complejidad', 'id_categoria', 'id_asignado', 'id_estado', 'id_lista', 'fecha_limite'];
      for (const key of allowedFields) {
        if (data[key] !== undefined && data[key] !== ticket[key]) {
          updateData[key] = data[key];
          cambios.push(`${key}: "${ticket[key]}" → "${data[key]}"`);
        }
      }
      if (Object.keys(updateData).length === 0) return ticket;
      const actualizado = await tx.pd_tickets.update({
        where: { id }, data: updateData,
        include: {
          area: true, estado: true, complejidad: true, categoria: true, lista: true,
          usuario_creador: { select: { id: true, nombre: true, email: true } },
          usuario_asignado: { select: { id: true, nombre: true, email: true } },
        },
      });
      if (cambios.length > 0) {
        await this.historialService.registrarAccion(id, user.id, 'editado', cambios.join(' | '), tx);
      }
      return actualizado;
    });
  }

  async getHistorial(id: number) {
    return this.historialService.getHistorial(id);
  }

  async moverTicket(id: number, id_lista: number, id_estado?: number, id_usuario?: number) {
    const actual = await this.prisma.pd_tickets.findUnique({
      where: { id },
      include: { lista: true, estado: true },
    });
    if (!actual) throw new NotFoundException('Ticket no encontrado');
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
    return this.prisma.$transaction(async (tx: any) => {
      const actualizado = await tx.pd_tickets.update({
        where: { id }, data: updateData,
        include: {
          area: true, estado: true, complejidad: true, lista: true,
          usuario_creador: { select: { id: true, nombre: true } },
          usuario_asignado: { select: { id: true, nombre: true } },
        },
      });
      if (id_usuario) {
        await this.historialService.registrarAccion(id, id_usuario, 'movido', cambios.join(' | '), tx);
      }
      return actualizado;
    });
  }

  async getTicketsFiltrados(query: any, user: any) {
    const page = parseInt(query.page) || 1;
    const limit = parseInt(query.limit) || 20;
    const skip = (page - 1) * limit;

    const permiso = this.visibilidad.fromRequest(user);
    const where: any = this.visibilidad.buildWhere(permiso);

    // Vista enviados — solo no-admin
    if (!permiso.esAdmin && query.vista === 'enviados') {
      delete where.OR;
      where.id_area_origen = permiso.id_area ?? 0;
      where.NOT = { id_area: permiso.id_area ?? 0 };
    }

    // Filtros adicionales
    if (query.estados) where.id_estado = { in: query.estados.split(',').map(Number) };
    if (query.area_destino) where.id_area = Number(query.area_destino);
    if (query.area_origen) where.id_area_origen = Number(query.area_origen);
    if (query.busqueda) {
      where.OR = [
        { titulo: { contains: query.busqueda, mode: 'insensitive' } },
        { codigo: { contains: query.busqueda, mode: 'insensitive' } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.pd_tickets.findMany({
        where, skip, take: limit,
        include: {
          area: true, estado: true, complejidad: true, categoria: true, lista: true,
          usuario_creador: { select: { id: true, nombre: true } },
          usuario_asignado: { select: { id: true, nombre: true } },
        },
        orderBy: { fecha_creacion: 'desc' },
      }),
      this.prisma.pd_tickets.count({ where }),
    ]);

    return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  async getCategorias(idArea?: number) {
    return this.prisma.pd_categorias.findMany({
      where: { activo: true, ...(idArea ? { id_area: idArea } : {}) },
      orderBy: { nombre: 'asc' },
    });
  }

  async getAsignables(idArea: number) {
    return this.prisma.usuarios.findMany({
      where: { id_area: idArea, activo: true },
      select: { id: true, nombre: true, email: true },
      orderBy: { nombre: 'asc' },
    });
  }

  async cambiarEstado(id: number, idEstado: number, user: any) {
    const ticket: any = await this.prisma.pd_tickets.findUnique({ where: { id }, include: { estado: true } });
    if (!ticket) throw new NotFoundException('Ticket no encontrado');
    const permiso = this.visibilidad.fromRequest(user);
    this.visibilidad.assertPuedeModificar(ticket, permiso);
    const nuevoEstado = await this.prisma.pd_estados.findUnique({ where: { id: idEstado } });
    if (!nuevoEstado) throw new BadRequestException('Estado no existe');
    return this.prisma.$transaction(async (tx: any) => {
      const actualizado = await tx.pd_tickets.update({
        where: { id }, data: { id_estado: idEstado },
        include: { area: true, estado: true, complejidad: true, lista: true,
          usuario_creador: { select: { id: true, nombre: true } },
          usuario_asignado: { select: { id: true, nombre: true } } },
      });
      await this.historialService.registrarAccion(id, user.id, 'estado', `Estado: "${ticket.estado.nombre}" → "${nuevoEstado.nombre}"`, tx);
      return actualizado;
    });
  }

  async asignarTicket(id: number, idAsignado: number | null, user: any) {
    const ticket: any = await this.prisma.pd_tickets.findUnique({ where: { id } });
    if (!ticket) throw new NotFoundException('Ticket no encontrado');
    const permiso = this.visibilidad.fromRequest(user);
    if (idAsignado === null) {
      this.visibilidad.assertPuedeDesasignar(ticket, permiso);
    } else {
      const usuariosArea = await this.prisma.usuarios.findMany({
        where: { id_area: ticket.id_area, activo: true },
        select: { id: true },
      });
      this.visibilidad.assertPuedeAsignar(ticket, permiso, idAsignado, usuariosArea.map((u: any) => u.id));
    }
    return this.prisma.$transaction(async (tx: any) => {
      const actualizado = await tx.pd_tickets.update({
        where: { id }, data: { id_asignado: idAsignado },
        include: { area: true, estado: true, complejidad: true, lista: true,
          usuario_creador: { select: { id: true, nombre: true } },
          usuario_asignado: { select: { id: true, nombre: true } } },
      });
      await this.historialService.registrarAccion(id, user.id, 'asignado', `Asignado a usuario ID: ${idAsignado ?? 'nadie'}`, tx);
      return actualizado;
    });
  }

  async eliminarTicket(id: number, user: any) {
    const ticket: any = await this.prisma.pd_tickets.findUnique({ where: { id } });
    if (!ticket) throw new NotFoundException('Ticket no encontrado');
    const permiso = this.visibilidad.fromRequest(user);
    this.visibilidad.assertPuedeModificar(ticket, permiso);
    return this.prisma.$transaction(async (tx: any) => {
      const eliminado = await tx.pd_tickets.update({ where: { id }, data: { eliminado: true } });
      await this.historialService.registrarAccion(id, user.id, 'eliminado', 'Ticket eliminado', tx);
      return eliminado;
    });
  }

  async promoverTicket(id: number, user: any) {
    const ticket: any = await this.prisma.pd_tickets.findUnique({ where: { id }, include: { estado: true } });
    if (!ticket) throw new NotFoundException('Ticket no encontrado');
    const permiso = this.visibilidad.fromRequest(user);
    this.visibilidad.assertPuedeModificar(ticket, permiso);
    const estados = await this.prisma.pd_estados.findMany({ orderBy: { id: 'asc' } });
    const idx = estados.findIndex((e: any) => e.id === ticket.id_estado);
    const siguiente = estados[idx + 1];
    if (!siguiente) throw new BadRequestException('El ticket ya está en el estado final');
    return this.cambiarEstado(id, siguiente.id, user);
  }
}
