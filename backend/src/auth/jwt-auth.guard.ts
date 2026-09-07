import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

// Put @UseGuards(JwtAuthGuard) on a controller or route to require a
// logged-in user. It runs JwtStrategy above.
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
