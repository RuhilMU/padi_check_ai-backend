import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateArticleDto } from './dto/create-article.dto';
import { UpdateArticleDto } from './dto/update-article.dto';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

@Injectable()
export class ArticlesService {
  
  async create(createArticleDto: CreateArticleDto) {
    const { diseaseId, ...articleData } = createArticleDto;

    return prisma.article.create({
      data: {
        ...articleData,
        disease: diseaseId ? { connect: { id: diseaseId } } : undefined
      }
    });
  }

  async findAll() {
    return prisma.article.findMany({
      orderBy: {
        createdAt: 'desc',
      },
      select: {
        id: true,
        title: true,
        slug: true,
        category: true,
        thumbnailUrl: true,
        description: true,
      }
    });
  }

  async findOne(slug: string) {
    const article = await prisma.article.findUnique({
      where: { slug: slug },
      include: {
        disease: {
          select: { name: true, code: true },
        }
      }
    });

    if (!article) {
      throw new NotFoundException(`Artikel dengan slug '${slug}' tidak ditemukan.`);
    }

    return {
      success: true,
      data: article,
    };
  }

  async update(id: number, updateArticleDto: UpdateArticleDto) {
    const existingArticle = await prisma.article.findUnique({ where: { id } });
    if (!existingArticle) throw new NotFoundException(`Artikel ${id} tidak ditemukan.`);
    const { diseaseId, ...articleData } = updateArticleDto;
    return prisma.article.update({
      where: { id },
      data: {
        ...articleData,
        disease: diseaseId ? { connect: { id: diseaseId } } : undefined
      }
    });
  }

async remove(id: number) {
    const existingArticle = await prisma.article.findUnique({ where: { id } });
    if (!existingArticle) {
        throw new NotFoundException(`Artikel ID ${id} tidak ditemukan.`);
    }

    await prisma.article.delete({
      where: { id }
    });

    return {
      success: true,
      message: `Artikel "${existingArticle.title}" berhasil dihapus.`
    };
  }
}