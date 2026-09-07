import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Res,
  StreamableFile,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import type { Response } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';
// 'import type' because User is only used as a type here. TypeScript
// needs to know that so it does not try to keep the import at runtime.
import type { User } from '@prisma/client';
import { ApplicationsService } from './applications.service';
import { UpdateApplicationDto } from './applications.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';

// Every route here needs a logged-in user.
@Controller()
@UseGuards(JwtAuthGuard)
export class ApplicationsController {
  constructor(private applications: ApplicationsService) {}

  // The form sends the file under the name "resume", plus a coverNote field.
  // FileInterceptor puts the file in memory so we can pass it to S3.
  @Post('jobs/:jobId/apply')
  @UseInterceptors(
    FileInterceptor('resume', { limits: { fileSize: 5 * 1024 * 1024 } }),
  )
  apply(
    @CurrentUser() user: User,
    @Param('jobId') jobId: string,
    @UploadedFile() resume: Express.Multer.File,
    @Body('coverNote') coverNote?: string,
  ) {
    return this.applications.apply(user, jobId, resume, coverNote);
  }

  @Get('applications/mine')
  findMine(@CurrentUser() user: User) {
    return this.applications.findMine(user);
  }

  @Get('jobs/:jobId/applications')
  findForJob(@CurrentUser() user: User, @Param('jobId') jobId: string) {
    return this.applications.findForJob(user, jobId);
  }

  // Used for both moving the stage and writing back to the candidate.
  @Patch('applications/:id')
  update(
    @CurrentUser() user: User,
    @Param('id') id: string,
    @Body() dto: UpdateApplicationDto,
  ) {
    return this.applications.update(user, id, dto);
  }

  // Sends the PDF itself. passthrough: true lets us set headers and still
  // return a StreamableFile, which Nest pipes to the browser for us.
  @Get('applications/:id/resume')
  async getResume(
    @CurrentUser() user: User,
    @Param('id') id: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { stream, filename } = await this.applications.getResume(user, id);

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="${filename}"`,
    });

    return new StreamableFile(stream);
  }
}
