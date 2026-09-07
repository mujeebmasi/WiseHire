import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
// 'import type' because User is only used as a type here.
import type { User } from '@prisma/client';
import { CompanyService } from './company.service';
import { CreateCompanyDto } from './company.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';

@Controller('company')
@UseGuards(JwtAuthGuard)
export class CompanyController {
  constructor(private company: CompanyService) {}

  // Returns the company, or null if this employer has not made one yet.
  @Get('mine')
  findMine(@CurrentUser() user: User) {
    return this.company.findMine(user);
  }

  @Post()
  create(@CurrentUser() user: User, @Body() dto: CreateCompanyDto) {
    return this.company.create(user, dto);
  }
}
