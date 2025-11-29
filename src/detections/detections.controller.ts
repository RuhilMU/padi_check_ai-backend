import { Controller, Post, UseInterceptors, UploadedFile, BadRequestException, UseGuards, Request } from '@nestjs/common'; // Tambah UseGuards, Request
import { DetectionsService } from './detections.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { AuthGuard } from '@nestjs/passport';

@Controller('detections')
export class DetectionsController {
  constructor(private readonly detectionsService: DetectionsService) {}

  @Post()
  @UseGuards(AuthGuard('jwt'))
  @UseInterceptors(FileInterceptor('image', {
    storage: diskStorage({
      destination: './uploads',
      filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = extname(file.originalname);
        cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
      },
    }),
    fileFilter: (req, file, callback) => {
      if (!file.mimetype.match(/\/(jpg|jpeg|png)$/)) {
        return callback(new BadRequestException('Hanya file gambar (jpg, jpeg, png) yang diperbolehkan!'), false);
      }
      callback(null, true);
    },
  }))
  async detectDisease(@UploadedFile() file: Express.Multer.File, @Request() req) {
    if (!file) {
      throw new BadRequestException('File gambar wajib diupload!');
    }
    
    const userId = req.user.userId; 
    
    return this.detectionsService.processDetection(file, userId);
  }
}