import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { User } from '@prisma/client';

// Lets a controller write @CurrentUser() user: User
// instead of digging into the raw request object.
export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): User => {
    // JwtStrategy.validate() put the user here.
    const request = ctx.switchToHttp().getRequest<{ user: User }>();
    return request.user;
  },
);
