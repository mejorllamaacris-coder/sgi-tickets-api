import { IsEmail, IsString, MinLength, IsInt, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

export class RegisterDto {
  @IsEmail({}, { message: 'El email no es válido' })
  email: string;

  @IsString()
  @MinLength(6, { message: 'La contraseña debe tener al menos 6 caracteres' })
  password: string;

  @IsString()
  nombre: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  id_area?: number;
}
