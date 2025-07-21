import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { AppService } from './app.service';
import { AuthenticationGuard } from './guards/authentication.guard';
import { AuthorizationGuard } from './guards/authorization.guard';

@UseGuards(AuthenticationGuard, AuthorizationGuard)

@Controller('/products')
export class AppController {
  constructor(private readonly appService: AppService) {}

  // @Permissions([{ resource: Resource.settings, actions: [Action.read] }])
  @Get()
  someProtectedRoute(@Req() req) {
    return { message: 'Accessed Resource', userId: req.userId };
  }
}
