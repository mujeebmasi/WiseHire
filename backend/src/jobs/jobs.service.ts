import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, User } from '@prisma/client';
import { PrismaService } from '../prisma.service';
import { CreateJobDto, JobFilterDto } from './jobs.dto';

@Injectable()
export class JobsService {
  constructor(private prisma: PrismaService) {}

  // Public job list, with optional search and filters.
  async findAll(filter: JobFilterDto) {
    const where: Prisma.JobWhereInput = { isOpen: true };

    if (filter.type) where.type = filter.type;
    if (filter.workMode) where.workMode = filter.workMode;

    if (filter.search) {
      const text = filter.search.trim();
      // Match if the words appear in the title, the description, or the
      // skills list. "insensitive" makes React and react both match.
      where.OR = [
        { title: { contains: text, mode: 'insensitive' } },
        { description: { contains: text, mode: 'insensitive' } },
        { skills: { has: text.toLowerCase() } },
      ];
    }

    return this.prisma.job.findMany({
      where,
      include: {
        company: { select: { id: true, name: true } },
        // Gives us job._count.applications without loading every application.
        _count: { select: { applications: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  async findOne(id: string) {
    const job = await this.prisma.job.findUnique({
      where: { id },
      include: { company: true, _count: { select: { applications: true } } },
    });

    if (!job) throw new NotFoundException('Job not found');

    return job;
  }

  // Jobs belonging to the logged-in employer, including closed ones.
  async findMine(user: User) {
    const company = await this.getMyCompany(user);

    return this.prisma.job.findMany({
      where: { companyId: company.id },
      include: {
        company: { select: { id: true, name: true } },
        _count: { select: { applications: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(user: User, dto: CreateJobDto) {
    const company = await this.getMyCompany(user);

    return this.prisma.job.create({
      data: {
        companyId: company.id,
        title: dto.title,
        description: dto.description,
        type: dto.type,
        workMode: dto.workMode ?? 'ONSITE',
        location: dto.location,
        // Store skills lowercase so filtering by skill matches reliably.
        skills: (dto.skills ?? []).map((s) => s.trim().toLowerCase()),
        minVerification: dto.minVerification ?? 'GOVT_ID',
        salaryMin: dto.salaryMin,
        salaryMax: dto.salaryMax,
      },
    });
  }

  async setOpen(user: User, jobId: string, isOpen: boolean) {
    await this.checkJobIsMine(user, jobId);

    return this.prisma.job.update({ where: { id: jobId }, data: { isOpen } });
  }

  // Throws unless this employer owns the company the job belongs to.
  // Used before anything that changes a job or reads its applicants.
  async checkJobIsMine(user: User, jobId: string) {
    const job = await this.prisma.job.findUnique({
      where: { id: jobId },
      include: { company: true },
    });

    if (!job) throw new NotFoundException('Job not found');

    if (job.company.ownerId !== user.id) {
      throw new ForbiddenException('This job belongs to another company');
    }

    return job;
  }

  private async getMyCompany(user: User) {
    const company = await this.prisma.company.findUnique({
      where: { ownerId: user.id },
    });

    if (!company) {
      throw new ForbiddenException(
        'Add your company details before posting a job',
      );
    }

    return company;
  }
}
