import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

@Injectable()
export class DashboardService {
  
  async getStats() {
    const aggregations = await prisma.detectionHistory.aggregate({
      _count: {
        id: true,
      },
      _avg: {
        accuracy: true,
      },
    });

    const totalDetections = aggregations._count.id;
    const avgAccuracy = aggregations._avg.accuracy || 0;
    const topDiseaseGroup = await prisma.detectionHistory.groupBy({
      by: ['diseaseId'],
      _count: {
        diseaseId: true,
      },
      orderBy: {
        _count: {
          diseaseId: 'desc',
        },
      },
      take: 1,
    });

    let topDiseaseName = '-';
    let topDiseaseCount = 0;

    if (topDiseaseGroup.length > 0) {
      const diseaseId = topDiseaseGroup[0].diseaseId;
      topDiseaseCount = topDiseaseGroup[0]._count.diseaseId;
      
      const disease = await prisma.disease.findUnique({
        where: { id: diseaseId }
      });
      topDiseaseName = disease ? disease.name : 'Unknown';
    }

    return {
      totalDetections,
      averageAccuracy: parseFloat(avgAccuracy.toFixed(2)), 
      topDisease: {
        name: topDiseaseName,
        total: topDiseaseCount
      },
    };
  }

  async getChartData() {   
    const healthyDisease = await prisma.disease.findUnique({
      where: { code: 'healthy' }
    });

    const diseaseGroups = await prisma.detectionHistory.groupBy({
      by: ['diseaseId'],
      _count: {
        diseaseId: true,
      },
      where: {
        diseaseId: {
          not: healthyDisease?.id || -1
        }
      }
    });

    const sickDiseases = await prisma.disease.findMany({
      where: {
        code: {
          not: 'healthy' 
        }
      }
    });
    
    const totalSickCount = diseaseGroups.reduce((acc, curr) => acc + curr._count.diseaseId, 0);
    const chartData = sickDiseases.map(disease => {
      const found = diseaseGroups.find(g => g.diseaseId === disease.id);
      const count = found ? found._count.diseaseId : 0;
      const percentage = totalSickCount > 0 ? (count / totalSickCount) * 100 : 0;

      return {
        name: disease.name,     
        count: count,           
        percentage: parseFloat(percentage.toFixed(1)) 
      };
    });

    return chartData.sort((a, b) => b.count - a.count);
  }

  async getRecentActivities() {
    const recent = await prisma.detectionHistory.findMany({
      take: 4,
      orderBy: {
        detectedAt: 'desc',
      },
      include: {
        disease: true,
      },
    });

    return recent.map(item => ({
      id: item.id,
      diseaseName: item.disease.name,
      status: item.status,
      imageUrl: item.imageUrl,
      time: item.detectedAt, 
    }));
  }
}