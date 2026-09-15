import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service.js';
import { LoginDto } from './dto/login.dto.js';
import { RegisterDto } from './dto/register.dto.js';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  private async resolverPermisos(idRol: number | null, idArea: number | null) {
    if (!idRol) return [];
    const registros = await this.prisma.roles_modulos.findMany({
      where: { id_rol: idRol },
      include: { modulo: true },
    });
    return registros.map(p => ({
      modulo: p.modulo.nombre,
      id_area: idArea,
      C: p.C,
      R: p.R,
      U: p.U,
      D: p.D,
      mod_admin: p.mod_admin,
    }));
  }

  async login(loginDto: LoginDto) {
    const user = await this.prisma.usuarios.findUnique({
      where: { email: loginDto.email },
      include: { rol: true },
    });
    if (!user || !(await bcrypt.compare(loginDto.password, user.password_hash))) {
      throw new UnauthorizedException('Credenciales invalidas');
    }
    const permisos = await this.resolverPermisos(user.id_rol ?? null, user.id_area ?? null);
    const payload = { sub: user.id, email: user.email, rol: user.rol?.nombre || null, permisos };
    return {
      access_token: this.jwtService.sign(payload),
      user: { id: user.id, nombre: user.nombre, email: user.email, id_area: user.id_area, rol: user.rol?.nombre || null, permisos },
    };
  }

  async register(registerDto: RegisterDto) {
    const existingUser = await this.prisma.usuarios.findUnique({ where: { email: registerDto.email } });
    if (existingUser) throw new ConflictException('El correo ya esta registrado');
    const hashedPassword = await bcrypt.hash(registerDto.password, 10);
    const newUser = await this.prisma.usuarios.create({
      data: { nombre: registerDto.nombre, email: registerDto.email, password_hash: hashedPassword, id_area: registerDto.id_area || null, id_rol: 2 },
      include: { rol: true },
    });
    const permisos = await this.resolverPermisos(newUser.id_rol ?? null, newUser.id_area ?? null);
    const payload = { sub: newUser.id, email: newUser.email, rol: newUser.rol?.nombre || null, permisos };
    return {
      access_token: this.jwtService.sign(payload),
      user: { id: newUser.id, nombre: newUser.nombre, email: newUser.email, id_area: newUser.id_area, rol: newUser.rol?.nombre || null, permisos },
    };
  }
}
