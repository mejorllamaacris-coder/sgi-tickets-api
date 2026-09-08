import { IsString, IsInt, IsOptional, IsNotEmpty, Min } from 'class-validator';

export class CrearComentarioDto {
  @IsString()
  @IsNotEmpty({ message: 'El contenido del comentario es requerido' })
  contenido: string;

  @IsInt()
  @Min(1)
  id_ticket: number;

  @IsInt()
  @IsOptional()
  id_padre?: number;

  @IsOptional()
  es_interno?: boolean;
}
