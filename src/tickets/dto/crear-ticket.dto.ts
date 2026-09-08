import { IsString, IsInt, IsOptional, IsNotEmpty, Min, IsDateString } from 'class-validator';

export class CrearTicketDto {
  @IsString()
  @IsNotEmpty({ message: 'El título es requerido' })
  titulo: string;

  @IsString()
  @IsOptional()
  descripcion?: string;

  @IsInt({ message: 'id_area debe ser un número entero' })
  @Min(1, { message: 'id_area debe ser mayor a 0' })
  id_area: number;

  @IsInt({ message: 'id_complejidad debe ser un número entero' })
  @Min(1, { message: 'id_complejidad debe ser mayor a 0' })
  id_complejidad: number;

  @IsInt()
  @IsOptional()
  id_asignado?: number;

  @IsInt()
  @IsOptional()
  id_categoria?: number;

  @IsDateString()
  @IsOptional()
  fecha_limite?: string;
}
