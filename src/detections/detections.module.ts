import { Module } from '@nestjs/common';
import { DetectionsService } from './detections.service';
import { DetectionsController } from './detections.controller';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [HttpModule],
  controllers: [DetectionsController],
  providers: [DetectionsService],
})
export class DetectionsModule {}
