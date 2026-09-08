import { IsString, IsInt, IsOptional, Min, IsDateString } from 'class-validator';

export class ActualizarTicketDto {
  @IsString()
  @IsOptional()
  titulo?: string;

  @IsString()
  @IsOptional()
  descripcion?: string;

  @IsInt()
  @IsOptional()
  @Min(1)
  id_estado?: number;

  @IsInt()
  @IsOptional()
  @Min(1)
  id_asignado?: number;

  @IsInt()
  @IsOptional()
  @Min(1)
  id_complejidad?: number;

  @IsInt()
  @IsOptional()
  @Min(1)
  id_categoria?: number;

  @IsDateString()
  @IsOptional()
  fecha_limite?: string;
}
