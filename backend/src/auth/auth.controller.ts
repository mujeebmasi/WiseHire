import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
// 'import type' because User is only used as a type here. TypeScript
// needs to know that so it does not try to keep the import at runtime.
import type { User } from '@prisma/client';
import { AuthService } from './auth.service';
import { LoginDto, RegisterDto, VerifyDto } from './auth.dto';
import { JwtAuthGuard } from './jwt-auth.guard';
import { CurrentUser } from './current-user.decorator';

@Controller('auth')
export class AuthController {
  constructor(private auth: AuthService) {}

  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.auth.register(dto);
  }

  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.auth.login(dto);
  }

  // Everything below needs a logged-in user.
  @Get('me')
  @UseGuards(JwtAuthGuard)
  me(@CurrentUser() user: User) {
    return this.auth.publicUser(user);
  }

  @Post('verify')
  @UseGuards(JwtAuthGuard)
  verify(@CurrentUser() user: User, @Body() dto: VerifyDto) {
    return this.auth.verify(user.id, dto);
  }
}
