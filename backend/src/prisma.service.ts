import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

// Makes Prisma available to every service through NestJS dependency injection.
// Extending PrismaClient means this.prisma.user, this.prisma.job, etc. all work.
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  async onModuleInit() {
    await this.$connect();
  }
}
