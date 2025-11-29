import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

@Injectable()
export class DetectionsService {

  async processDetection(file: Express.Multer.File, userId: string) {
    
    // Nanti ganti domain asli
    const imageUrl = `http://localhost:3000/uploads/${file.filename}`;

    // MOCK ML Purapura panggil AI Python, acak dulu biar backend jalan
    const mockResult = this.mockPrediction(); 

    const disease = await prisma.disease.findUnique({
      where: { code: mockResult.predictedClass }
    });

    if (!disease) {
      throw new NotFoundException(`Penyakit ${mockResult.predictedClass} tidak ditemukan di database.`);
    }

    let severity: 'HEALTHY' | 'LOW' | 'MEDIUM' | 'HIGH' = 'LOW';
    if (disease.code === 'healthy') severity = 'HEALTHY';
    else if (mockResult.confidence > 0.9) severity = 'HIGH';
    else if (mockResult.confidence > 0.7) severity = 'MEDIUM';

    const history = await prisma.detectionHistory.create({
      data: {
        imageUrl: imageUrl,
        accuracy: parseFloat((mockResult.confidence * 100).toFixed(1)),
        severity: severity,
        status: disease.code === 'healthy' ? 'Sehat' : 'Terdeteksi',
        diseaseId: disease.id,
        userId: userId
      },
      include: {
        disease: true
      }
    });
    return {
      message: 'Deteksi berhasil',
      data: history
    };
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
      confidence: randomConfidence
    };
  }
}