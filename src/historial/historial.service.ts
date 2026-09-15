import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class HistorialService {
  constructor(private prisma: PrismaService) {}

  async registrarAccion(
    id_ticket: number,
    id_usuario: number,
    accion: string,
    detalle?: string | null,
    txClient?: any
  ) {
    const client = txClient || this.prisma;
    return client.pd_historial.create({
      data: {
        id_ticket,
        id_usuario,
        accion,
        detalle: detalle || null,
      },
    });
  }

  async getHistorial(id_ticket: number) {
    return this.prisma.pd_historial.findMany({
      where: { id_ticket },
      include: {
        usuario: { select: { id: true, nombre: true, email: true } },
      },
      orderBy: { id: 'desc' },
    });
  }
}
