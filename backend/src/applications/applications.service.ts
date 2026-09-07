import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { Prisma, User } from '@prisma/client';
import { PrismaService } from '../prisma.service';
import { StorageService } from '../storage/storage.service';
import { JobsService } from '../jobs/jobs.service';
import { UpdateApplicationDto } from './applications.dto';
import { isVerifiedEnough, LEVEL_TEXT } from '../verification';

// What an employer is allowed to see about someone who applied.
// Note there is no email here: contact details come after shortlisting.
const CANDIDATE_FIELDS = {
  id: true,
  name: true,
  headline: true,
  location: true,
  skills: true,
  verification: true,
  govIdLast4: true,
};

@Injectable()
export class ApplicationsService {
  private logger = new Logger(ApplicationsService.name);

  constructor(
    private prisma: PrismaService,
    private storage: StorageService,
    private jobs: JobsService,
  ) {}

  // This is the main idea of the app.
  async apply(
    user: User,
    jobId: string,
    file: Express.Multer.File,
    coverNote?: string,
  ) {
    if (!file) throw new BadRequestException('Please attach your resume');

    if (file.mimetype !== 'application/pdf') {
      throw new BadRequestException('Resume must be a PDF file');
    }

    const job = await this.prisma.job.findUnique({ where: { id: jobId } });
    if (!job) throw new NotFoundException('Job not found');
    if (!job.isOpen) {
      throw new BadRequestException(
        'This job is no longer accepting applications',
      );
    }

    // The check the whole product is built around.
    if (!isVerifiedEnough(user.verification, job.minVerification)) {
      throw new ForbiddenException(
        `This job is only open to candidates who are ${LEVEL_TEXT[job.minVerification]}. ` +
          `Your account is ${LEVEL_TEXT[user.verification]}. Verify your identity to apply.`,
      );
    }

    // Only save the file once we know the application is allowed, so we do
    // not leave files on disk for applications that were rejected.
    let resumeKey: string;
    try {
      resumeKey = await this.storage.saveResume(user.id, file);
    } catch (error) {
      // Without this the applicant just sees "Internal server error", which
      // tells them nothing. The real reason goes to the server log.
      this.logger.error('Saving the resume failed', error);
      throw new ServiceUnavailableException(
        'Could not save your resume. Please try again.',
      );
    }

    try {
      return await this.prisma.application.create({
        data: {
          jobId,
          userId: user.id,
          resumeKey,
          resumeName: file.originalname,
          coverNote,
        },
      });
    } catch (error) {
      // P2002 is Prisma's code for "a unique rule was broken". Here that can
      // only be the jobId + userId rule, so they already applied.
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException('You have already applied to this job');
      }
      throw error;
    }
  }

  // Applications made by the logged-in candidate.
  findMine(user: User) {
    return this.prisma.application.findMany({
      where: { userId: user.id },
      include: { job: { include: { company: { select: { name: true } } } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  // Everyone who applied to one job. Only the employer who owns it can look.
  async findForJob(user: User, jobId: string) {
    await this.jobs.checkJobIsMine(user, jobId);

    return this.prisma.application.findMany({
      where: { jobId },
      include: { user: { select: CANDIDATE_FIELDS } },
      orderBy: { createdAt: 'desc' },
    });
  }

  // Moves an application along, writes a message back to the candidate, or
  // both. Only the employer who posted the job may do either.
  async update(user: User, applicationId: string, dto: UpdateApplicationDto) {
    const application = await this.prisma.application.findUnique({
      where: { id: applicationId },
    });

    if (!application) throw new NotFoundException('Application not found');

    await this.jobs.checkJobIsMine(user, application.jobId);

    return this.prisma.application.update({
      where: { id: applicationId },
      // Only write the fields that were actually sent. Spreading a missing
      // field as undefined would be fine, but listing them makes it obvious
      // that nothing else on the application can be changed here.
      data: {
        ...(dto.stage ? { stage: dto.stage } : {}),
        ...(dto.employerMessage !== undefined
          ? { employerMessage: dto.employerMessage }
          : {}),
      },
    });
  }

  // Opens the resume file for download. Allowed for the candidate who wrote
  // it, and for the employer whose job they applied to - nobody else.
  async getResume(user: User, applicationId: string) {
    const application = await this.prisma.application.findUnique({
      where: { id: applicationId },
    });

    if (!application) throw new NotFoundException('Application not found');

    if (application.userId !== user.id) {
      // Not their own application, so they must be the employer who posted it.
      await this.jobs.checkJobIsMine(user, application.jobId);
    }

    return {
      stream: this.storage.readResume(application.resumeKey),
      filename: application.resumeName,
    };
  }
}
