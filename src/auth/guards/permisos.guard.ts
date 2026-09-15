import { Injectable, CanActivate, ExecutionContext, ForbiddenException, SetMetadata } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

// Decorador oficial de NestJS
export const Permisos = (...permisos: string[]) => SetMetadata('permisos', permisos);

@Injectable()
export class PermisosGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredPermisos = this.reflector.get<string[]>('permisos', context.getHandler());
    
    if (!requiredPermisos || requiredPermisos.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('Usuario no autenticado');
    }

    // Si es admin, tiene acceso a todo
    if (user.permisos && user.permisos.includes('admin')) {
      return true;
    }

    const hasPermission = requiredPermisos.some((permiso) => 
      user.permisos && user.permisos.includes(permiso)
    );

    if (!hasPermission) {
      throw new ForbiddenException('No tienes los permisos necesarios');
    }

    return true;
  }
}
