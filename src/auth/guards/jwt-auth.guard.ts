import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { PrismaService } from '../../prisma/prisma.service.js';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') implements CanActivate {
  constructor(private prisma: PrismaService) {
    super();
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // 1. Ejecuta la validación base del JWT (estrategia + token)
    const result = (await super.canActivate(context)) as boolean;
    if (!result) return false;

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    // 2. Validación adicional: verificar que el usuario aún exista en la BD
    if (user?.id) {
      const dbUser = await this.prisma.usuarios.findUnique({
        where: { id: user.id },
        select: { id: true, nombre: true, email: true }, // Campos que sí existen en el schema
      });
      
      if (!dbUser) {
        throw new UnauthorizedException('Usuario no encontrado o inactivo');
      }
    }

    return true;
  }

  handleRequest(err: any, user: any, info: any) {
    if (err || !user) {
      throw err || new UnauthorizedException('Token inválido o expirado');
    }
    return user;
  }
}
