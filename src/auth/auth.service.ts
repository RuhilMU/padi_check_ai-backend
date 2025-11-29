import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

@Injectable()
export class AuthService {
  constructor(private jwtService: JwtService) {}

  async login(loginDto: { email: string; password: string }) {
    const user = await prisma.user.findUnique({
      where: { email: loginDto.email },
    });

    if (!user) {
      throw new UnauthorizedException('Email tidak terdaftar');
    }

    const isPasswordValid = await bcrypt.compare(loginDto.password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Password salah');
    }

    const payload = { sub: user.id, email: user.email, role: user.role };
    
    return {
      message: 'Login berhasil',
      accessToken: this.jwtService.sign(payload),
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        role: user.role
      }
    };
  }

  async register(registerDto: any) {
    const existingUser = await prisma.user.findUnique({
      where: { email: registerDto.email }
    });

    if (existingUser) {
      throw new BadRequestException('Email sudah digunakan');
    }

    const hashedPassword = await bcrypt.hash(registerDto.password, 10);

    const newUser = await prisma.user.create({
      data: {
        email: registerDto.email,
        password: hashedPassword,
        fullName: registerDto.fullName,
        phone: registerDto.phone,
        role: 'USER',
      },
    });

    return {
      message: 'Registrasi berhasil',
      data: newUser
    };
  }
}