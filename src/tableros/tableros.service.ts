import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class TablerosService {
  constructor(private prisma: PrismaService) {}

  // NUEVO: Endpoint para listar tableros
  async findAll(idAreas?: number[]) {
    const where: any = { activo: true };
    if (idAreas && idAreas.length > 0) {
      where.id_area = { in: idAreas };
    }
    return this.prisma.pd_tableros.findMany({
      where,
      include: { area: { select: { id: true, nombre: true } } },
      orderBy: { nombre: 'asc' }
    });
  }

  async findOne(id: number) {
    const tablero = await this.prisma.pd_tableros.findFirst({
      where: { id, activo: true },
      include: {
        area: true,
        listas: {
          orderBy: { orden: 'asc' },
          include: {
            tickets: {
              where: { tipo: 'proyecto' },
              include: {
                estado: { select: { id: true, nombre: true, color: true } },
                complejidad: { select: { id: true, nombre: true, color: true } },
                usuario_asignado: { select: { id: true, nombre: true } },
              },
              orderBy: { fecha_creacion: 'asc' },
            },
          },
        },
      },
    });

    if (!tablero) throw new NotFoundException('Tablero no encontrado o inactivo');

    const ticketsSinLista = await this.prisma.pd_tickets.findMany({
      where: { id_area: tablero.id_area, id_lista: null, tipo: 'proyecto' },
      include: {
        estado: { select: { id: true, nombre: true, color: true } },
        complejidad: { select: { id: true, nombre: true, color: true } },
        usuario_asignado: { select: { id: true, nombre: true } },
      },
      orderBy: { fecha_creacion: 'asc' },
    });

    const listasConTarjetas = tablero.listas.map((l: any) => ({
      ...l,
      tarjetas: l.tickets,
    }));

    return {
      ...tablero,
      listas: listasConTarjetas,
      tickets_sin_lista: ticketsSinLista,
    };
  }
  async crear(data: any, idUsuario: number) {
    return this.prisma.pd_tableros.create({
      data: {
        nombre: data.nombre,
        descripcion: data.descripcion,
        id_area: data.id_area,
        listas: {
          create: [
            { nombre: 'BACKLOG', orden: 1 },
            { nombre: 'POR HACER', orden: 2 },
            { nombre: 'EN DESARROLLO', orden: 3 },
            { nombre: 'HECHO', orden: 4 },
          ],
        },
      },
      include: { area: true, listas: { orderBy: { orden: 'asc' } } },
    });
  }

  async desactivar(id: number) {
    return this.prisma.pd_tableros.update({
      where: { id },
      data: { activo: false },
    });
  }

  async reordenarListas(idTablero: number, movimientos: { id: number; orden: number }[]) {
    await Promise.all(
      movimientos.map((m) =>
        this.prisma.pd_listas.update({ where: { id: m.id }, data: { orden: m.orden } }),
      ),
    );
    return this.findOne(idTablero);
  }

  async moverTicket(idTicket: number, idLista: number, idUsuario: number) {
    const lista = await this.prisma.pd_listas.findUnique({ where: { id: idLista } });
    if (!lista) throw new NotFoundException('Lista no encontrada');
    return this.prisma.pd_tickets.update({
      where: { id: idTicket },
      data: { id_lista: idLista },
      include: {
        estado: true, complejidad: true, lista: true,
        usuario_asignado: { select: { id: true, nombre: true } },
      },
    });
  }

}
