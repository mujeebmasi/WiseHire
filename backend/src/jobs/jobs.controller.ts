import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
// 'import type' because User is only used as a type here. TypeScript
// needs to know that so it does not try to keep the import at runtime.
import type { User } from '@prisma/client';
import { JobsService } from './jobs.service';
import { CreateJobDto, JobFilterDto } from './jobs.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';

@Controller('jobs')
export class JobsController {
  constructor(private jobs: JobsService) {}

  // Anyone can browse jobs, logged in or not.
  @Get()
  findAll(@Query() filter: JobFilterDto) {
    return this.jobs.findAll(filter);
  }

  // Must come before ':id', otherwise Nest treats "mine" as an id.
  @Get('mine')
  @UseGuards(JwtAuthGuard)
  findMine(@CurrentUser() user: User) {
    return this.jobs.findMine(user);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.jobs.findOne(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@CurrentUser() user: User, @Body() dto: CreateJobDto) {
    return this.jobs.create(user, dto);
  }

  @Patch(':id/open')
  @UseGuards(JwtAuthGuard)
  setOpen(
    @CurrentUser() user: User,
    @Param('id') id: string,
    @Body('isOpen') isOpen: boolean,
  ) {
    return this.jobs.setOpen(user, id, isOpen);
  }
}
