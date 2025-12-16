import { Injectable, NotFoundException, InternalServerErrorException, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import FormData = require('form-data');
import * as fs from 'fs';

const prisma = new PrismaClient();

@Injectable()
export class DetectionsService {
  private readonly logger = new Logger(DetectionsService.name);
  private readonly mlApiUrl: string;

  constructor(private readonly httpService: HttpService) {
    this.mlApiUrl = process.env.ML_API_URL || 'http://localhost:5000';
    this.logger.log(`ML API URL: ${this.mlApiUrl}`);
  }

  async processDetection(file: Express.Multer.File, userId: string) {

    const baseUrl = 'https://' + process.env.RAILWAY_PUBLIC_DOMAIN;
    const imageUrl = `${baseUrl}/uploads/${file.filename}`;

    // Call actual ML service
    const mlResult = await this.callMLService(file);

    const disease = await prisma.disease.findUnique({
      where: { code: mlResult.predictedClass },
      include: {
        articles: true,
      }
    });

    if (!disease) {
      throw new NotFoundException(`Penyakit ${mlResult.predictedClass} tidak ditemukan di database.`);
    }

    const newId = await this.generateDetectionId();
    const history = await prisma.detectionHistory.create({
      data: {
        id: newId,
        imageUrl: imageUrl,
        accuracy: parseFloat((mlResult.confidence * 100).toFixed(1)),
        status: disease.code === 'healthy' ? 'Sehat' : 'Terdeteksi Penyakit',
        diseaseId: disease.id,
        userId: userId,
      },
      include: {
        disease: {
          include: {
            articles: true,
          }
        }
      }
    });

    return {
      message: 'Deteksi berhasil',
      data: {
        id: history.id,
        imageUrl: history.imageUrl,
        accuracy: history.accuracy,
        status: history.status,
        detectedAt: history.detectedAt,
        disease: {
          name: history.disease.name,
          description: history.disease.description,
          solutions: history.disease.solutions,
        },
        articleSlug: history.disease.articles.length > 0 ? history.disease.articles[0].slug : null
      }
    };
  }

  async findAllHistory(userId?: string) {
    const whereCondition = userId ? { userId: userId } : {};

    const history = await prisma.detectionHistory.findMany({
      where: whereCondition,
      orderBy: {
        detectedAt: 'desc',
      },
      include: {
        disease: true,
      }
    });

    return {
      message: 'Data riwayat berhasil diambil',
      data: history
    };
  }

  private async generateDetectionId(): Promise<string> {
    const now = new Date();
    const year = now.getFullYear();
    const count = await prisma.detectionHistory.count();
    const sequence = String(count + 1).padStart(3, '0');
    return `DET-${year}-${sequence}`;
  }

  /**
   * Call ML service to get prediction
   */
  private async callMLService(file: Express.Multer.File): Promise<{ predictedClass: string, confidence: number }> {
    try {
      this.logger.log(`Calling ML service for file: ${file.filename}`);

      // Create form data
      const formData = new FormData();
      formData.append('file', fs.createReadStream(file.path), {
        filename: file.originalname,
        contentType: file.mimetype,
      });

      // Call ML service
      const response = await firstValueFrom(
        this.httpService.post(`${this.mlApiUrl}/predict`, formData, {
          headers: {
            ...formData.getHeaders(),
          },
          timeout: 600000, // lamain timeout
        })
      );

      this.logger.log(`ML service response: ${JSON.stringify(response.data)}`);

      return {
        predictedClass: response.data.predictedClass,
        confidence: response.data.confidence,
      };

    } catch (error) {
      this.logger.error(`ML service error: ${error.message}`);

      if (error.code === 'ECONNREFUSED') {
        throw new InternalServerErrorException('ML service tidak dapat dihubungi. Pastikan service berjalan.');
      }

      if (error.response) {
        throw new InternalServerErrorException(`ML service error: ${error.response.data?.detail || error.message}`);
      }

      throw new InternalServerErrorException('Gagal melakukan prediksi. Silakan coba lagi.');
    }
  }
}