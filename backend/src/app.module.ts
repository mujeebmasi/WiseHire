import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma.module';
import { AuthModule } from './auth/auth.module';
import { CompanyModule } from './company/company.module';
import { JobsModule } from './jobs/jobs.module';
import { ApplicationsModule } from './applications/applications.module';
import { StorageModule } from './storage/storage.module';

@Module({
  imports: [
    // Loads the .env file and makes process.env available everywhere.
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    CompanyModule,
    JobsModule,
    ApplicationsModule,
    StorageModule,
  ],
})
export class AppModule {}
