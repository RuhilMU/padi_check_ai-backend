import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

@Injectable()
export class DetectionsService {

  async processDetection(file: Express.Multer.File, userId: string) {
    
    const baseUrl = 'https://' + process.env.RAILWAY_PUBLIC_DOMAIN;
    const imageUrl = `${baseUrl}/uploads/${file.filename}`;

    // MOCK ML Purapura panggil AI Python, acak dulu biar backend jalan
    const mockResult = this.mockPrediction(); 

    const disease = await prisma.disease.findUnique({
      where: { code: mockResult.predictedClass },
      include: {
        articles: true,
      }
    });

    if (!disease) {
      throw new NotFoundException(`Penyakit ${mockResult.predictedClass} tidak ditemukan di database.`);
    }

    const newId = await this.generateDetectionId();
    const history = await prisma.detectionHistory.create({
      data: {
        id: newId,
        imageUrl: imageUrl,
        accuracy: parseFloat((mockResult.confidence * 100).toFixed(1)),
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

  // MOCKING AI (Nanti apus kalau model sudah jadey)
  private mockPrediction() {
    const classes = [
      'leaf_scald', 
      'bacterial_leaf_blight', 
      'narrow_brown_spot', 
      'healthy', 
      'leaf_blast', 
      'brown_spot'
    ];
    
    // Pilih acak 1 penyakit
    const randomClass = classes[Math.floor(Math.random() * classes.length)];
    // Acak confidence antara 70% - 99%
    const randomConfidence = 0.7 + Math.random() * 0.29;

    return {
      predictedClass: randomClass,
      confidence: randomConfidence,
    };
  }
}