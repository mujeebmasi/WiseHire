import { Module } from '@nestjs/common';
import { ApplicationsService } from './applications.service';
import { ApplicationsController } from './applications.controller';
import { JobsModule } from '../jobs/jobs.module';

@Module({
  // We need JobsService here to check that an employer owns a job.
  imports: [JobsModule],
  controllers: [ApplicationsController],
  providers: [ApplicationsService],
})
export class ApplicationsModule {}
