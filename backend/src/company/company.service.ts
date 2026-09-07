import {
  ConflictException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { User } from '@prisma/client';
import { PrismaService } from '../prisma.service';
import { CreateCompanyDto } from './company.dto';

@Injectable()
export class CompanyService {
  constructor(private prisma: PrismaService) {}

  // Returns null rather than throwing, because "I do not have a company yet"
  // is a normal state for a new employer, not an error.
  findMine(user: User) {
    return this.prisma.company.findUnique({ where: { ownerId: user.id } });
  }

  async create(user: User, dto: CreateCompanyDto) {
    if (user.role !== 'EMPLOYER') {
      throw new ForbiddenException('Only employer accounts can add a company');
    }

    // ownerId is unique in the database, so a second attempt would fail there
    // anyway. Checking here just gives a clearer message.
    const existing = await this.findMine(user);
    if (existing) {
      throw new ConflictException('You already have a company');
    }

    return this.prisma.company.create({
      data: {
        name: dto.name,
        description: dto.description,
        website: dto.website,
        ownerId: user.id,
      },
    });
  }
}
