import { Injectable, ForbiddenException } from '@nestjs/common';

export interface PermisoUsuario {
  userId: number;
  id_area: number | null;
  esAdmin: boolean;
  esLider: boolean;
}

export interface TicketVisible {
  id_area: number;
  id_area_origen: number | null;
  id_creador: number;
  id_asignado: number | null;
}

@Injectable()
export class VisibilidadService {

  fromRequest(user: any): PermisoUsuario {
    const permisos: string[] = user.rol?.permisos ?? [];
    return {
      userId: user.id,
      id_area: user.id_area ?? null,
      esAdmin: permisos.includes('admin') || user.rol?.nombre === 'admin',
      esLider: permisos.includes('tickets.asignar') || permisos.includes('lider'),
    };
  }

  buildWhere(permiso: PermisoUsuario): any {
    if (permiso.esAdmin) return { eliminado: false };
    return {
      eliminado: false,
      OR: [
        { id_area: permiso.id_area ?? 0 },
        { id_area_origen: permiso.id_area ?? 0 },
        { id_creador: permiso.userId },
      ],
    };
  }

  assertPuedeVer(ticket: TicketVisible, permiso: PermisoUsuario): void {
    if (permiso.esAdmin) return;
    if (ticket.id_area === permiso.id_area) return;
    if (ticket.id_area_origen === permiso.id_area) return;
    if (ticket.id_creador === permiso.userId) return;
    throw new ForbiddenException('No tienes permisos para ver este ticket');
  }

  assertPuedeModificar(ticket: TicketVisible, permiso: PermisoUsuario): void {
    if (permiso.esAdmin) return;
    if (ticket.id_area === permiso.id_area && permiso.esLider) return;
    throw new ForbiddenException('No puedes modificar tickets que no pertenecen a tu área');
  }

  assertPuedeAsignar(
    ticket: TicketVisible,
    permiso: PermisoUsuario,
    idAsignadoDestino: number,
    idsAreaTicket: number[],
  ): void {
    if (permiso.esAdmin) return;
    if (idAsignadoDestino === permiso.userId) {
      this.assertPuedeVer(ticket, permiso);
      return;
    }
    if (ticket.id_area === permiso.id_area && permiso.esLider) {
      if (idsAreaTicket.includes(idAsignadoDestino)) return;
      throw new ForbiddenException('El usuario destino no pertenece al área del ticket');
    }
    throw new ForbiddenException('No tienes permisos para asignar este ticket a otro usuario');
  }

  assertPuedeDesasignar(ticket: TicketVisible, permiso: PermisoUsuario): void {
    if (permiso.esAdmin) return;
    if (ticket.id_area === permiso.id_area && permiso.esLider) return;
    if (ticket.id_asignado === permiso.userId) return;
    throw new ForbiddenException('No tienes permisos para quitar la asignación');
  }

  assertPuedeComentar(ticket: TicketVisible, permiso: PermisoUsuario): void {
    if (permiso.esAdmin) return;
    if (ticket.id_area === permiso.id_area) return;
    if (ticket.id_area_origen === permiso.id_area) return;
    if (ticket.id_creador === permiso.userId) return;
    throw new ForbiddenException('No puedes comentar en este ticket');
  }
}
