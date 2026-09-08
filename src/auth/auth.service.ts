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

  async login(loginDto: LoginDto) {
    const user = await this.prisma.usuarios.findUnique({
      where: { email: loginDto.email },
    });

    if (!user || !(await bcrypt.compare(loginDto.password, user.password_hash))) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const payload = { sub: user.id, email: user.email };
    return {
      access_token: this.jwtService.sign(payload),
      user: { id: user.id, nombre: user.nombre, email: user.email, id_area: user.id_area },
    };
  }

  async register(registerDto: RegisterDto) {
    const existingUser = await this.prisma.usuarios.findUnique({
      where: { email: registerDto.email },
    });

    if (existingUser) {
      throw new ConflictException('El correo ya está registrado');
    }

    const hashedPassword = await bcrypt.hash(registerDto.password, 10);

    const newUser = await this.prisma.usuarios.create({
      data: {
        nombre: registerDto.nombre,
        email: registerDto.email,
        password_hash: hashedPassword,
        id_area: registerDto.id_area || null,
      },
      select: { id: true, nombre: true, email: true, id_area: true },
    });

    return newUser;
  }
}
