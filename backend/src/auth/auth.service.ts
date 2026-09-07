import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { User } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma.service';
import { LoginDto, RegisterDto, VerifyDto } from './auth.dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const email = dto.email.toLowerCase();

    const existing = await this.prisma.user.findUnique({ where: { email } });
    if (existing) {
      throw new ConflictException('An account with this email already exists');
    }

    // Never store the real password. bcrypt turns it into a hash that
    // cannot be reversed; at login we hash the attempt and compare.
    const hash = await bcrypt.hash(dto.password, 10);

    const user = await this.prisma.user.create({
      data: { email, password: hash, name: dto.name, role: dto.role },
    });

    return { user: this.publicUser(user), token: this.createToken(user.id) };
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });

    // Same message whether the email or the password was wrong, so nobody
    // can use this endpoint to find out which emails have accounts.
    if (!user || !(await bcrypt.compare(dto.password, user.password))) {
      throw new UnauthorizedException('Wrong email or password');
    }

    return { user: this.publicUser(user), token: this.createToken(user.id) };
  }

  // Pretend government ID check. A real one would call DigiLocker here.
  async verify(userId: string, dto: VerifyDto) {
    if (dto.otp !== '123456') {
      throw new UnauthorizedException('Wrong OTP. Use 123456 in this demo.');
    }

    const user = await this.prisma.user.update({
      where: { id: userId },
      data: {
        verification: 'GOVT_ID',
        // Only the last 4 digits. Storing a full Aadhaar number would be
        // both illegal and pointless for what we need it for.
        govIdLast4: dto.aadhaarNumber.slice(-4),
      },
    });

    return this.publicUser(user);
  }

  createToken(userId: string) {
    // "sub" is the standard JWT field for who the token belongs to.
    return this.jwt.sign({ sub: userId });
  }

  // The fields we are happy to send to the browser. Listing them one by one
  // means the password hash can never be included by accident, and neither
  // can any column we add to the User model later.
  publicUser(user: User) {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      headline: user.headline,
      location: user.location,
      skills: user.skills,
      role: user.role,
      verification: user.verification,
      govIdLast4: user.govIdLast4,
    };
  }
}
