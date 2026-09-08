import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class TablerosService {
  constructor(private prisma: PrismaService) {}

  async getTableroConListas(id_tablero: number) {
    const tablero = await this.prisma.pd_tableros.findUnique({
      where: { id: id_tablero, activo: true },
      include: {
        area: { select: { id: true, nombre: true } },
        listas: {
          orderBy: { orden: 'asc' },
          include: {
            tickets: {
              where: { id_lista: { not: null } }, // Solo tickets que ya están en una lista
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

    // También obtenemos los tickets del área que aún NO tienen lista asignada (para la columna "Sin asignar" o Backlog)
    const ticketsSinLista = await this.prisma.pd_tickets.findMany({
      where: { id_area: tablero.id_area, id_lista: null },
      include: {
        estado: { select: { id: true, nombre: true, color: true } },
        complejidad: { select: { id: true, nombre: true, color: true } },
        usuario_asignado: { select: { id: true, nombre: true } },
      },
      orderBy: { fecha_creacion: 'asc' },
    });

    return {
      ...tablero,
      tickets_sin_lista: ticketsSinLista,
    };
  }
}
