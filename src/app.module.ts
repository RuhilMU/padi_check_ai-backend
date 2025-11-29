import { Module } from '@nestjs/common';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { DetectionsModule } from './detections/detections.module';
// import { AppController } from './app.controller';
// import { AppService } from './app.service';
import { DashboardModule } from './dashboard/dashboard.module';
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'uploads'),
      serveRoot: '/uploads', 
    }),
    DetectionsModule,
    DashboardModule,
    AuthModule,
  ],
  // controllers: [AppController],
  // providers: [AppService],
})
export class AppModule {}
