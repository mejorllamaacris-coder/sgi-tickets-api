import { IsEmail, IsString, MinLength, IsOptional, IsInt } from 'class-validator';

export class RegisterDto {
  @IsString()
  @MinLength(3, { message: 'El nombre debe tener al menos 3 caracteres' })
  nombre: string;

  @IsEmail({}, { message: 'El correo debe ser válido' })
  email: string;

  @IsString()
  @MinLength(6, { message: 'La contraseña debe tener al menos 6 caracteres' })
  password: string;

  @IsOptional()
  @IsInt()
  id_area?: number;
}
