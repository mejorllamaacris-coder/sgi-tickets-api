export class CrearTicketDto {
  titulo: string;
  descripcion?: string;
  id_area: number;
  id_complejidad: number;
  id_categoria?: number;
  id_asignado?: number;
  fecha_limite?: string;
}
