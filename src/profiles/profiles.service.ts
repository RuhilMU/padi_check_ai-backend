import { Injectable, BadRequestException } from '@nestjs/common';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

@Injectable()
export class ProfilesService {
    async getProfile(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        fullName: true,
        email: true,
        phone: true,
        role: true,
      }
    });

    return {
      success: true,
      data: user
    };
  }

  async updateProfile(userId: string, updateProfileDto: UpdateProfileDto) {
    if (updateProfileDto.email) {
      const emailExist = await prisma.user.findUnique({
        where: { email: updateProfileDto.email }
      });

      if (emailExist && emailExist.id !== userId) {
        throw new BadRequestException('Email sudah digunakan pengguna lain.');
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateProfileDto,
      select: {
        id: true,
        fullName: true,
        email: true,
        phone: true,
        role: true
      }
    });

    return {
      success: true,
      message: 'Profil berhasil diperbarui.',
      data: updatedUser
    };
  }
}