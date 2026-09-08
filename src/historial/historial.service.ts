import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { Prisma } from '@prisma/client';

@Injectable()
export class HistorialService {
  constructor(private prisma: PrismaService) {}

  /**
   * Registra una acción en el historial.
   * @param txClient (Opcional) Cliente de transacción. Si se pasa, se usa; si no, usa el cliente normal.
   */
  async registrarAccion(
    id_ticket: number,
    id_usuario: number,
    accion: string,
    detalle?: string | null,
    txClient?: any // Usamos 'any' aquí para evitar conflictos de tipos complejos de Prisma.TransactionClient
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
}
