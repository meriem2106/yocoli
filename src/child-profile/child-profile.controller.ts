import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';

import { ChildProfileService } from './child-profile.service';
import { CreateChildDto } from './dto/create-child-profile.dto';

import { AuthenticationGuard } from 'src/guards/authentication.guard';
import { AuthorizationGuard } from 'src/guards/authorization.guard'; // facultatif
import { CurrentUser } from 'src/decorators/current-user.decorator';
import { JwtPayload } from 'src/types/jwt-payload.interface';
import { UpdateChildDto } from './dto/update-child-profile.dto';

@UseGuards(AuthenticationGuard, AuthorizationGuard)
@Controller('children')
export class ChildProfileController {
  constructor(private readonly childService: ChildProfileService) {}

  @Post()
  create(
    @Body() dto: CreateChildDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.childService.create(dto, user.userId);
  }

  @Get()
  getChildren(@CurrentUser() user: JwtPayload) {
    return this.childService.findByParent(user.userId);
  }

  @Patch(':id')
  updateChild(
    @Param('id') childId: string,
    @Body() dto: UpdateChildDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.childService.update(childId, dto, user.userId);
  }

  @Get(':id')
async getChildById(
  @Param('id') childId: string,
  @CurrentUser() user: JwtPayload,
) {
  return this.childService.findOneById(childId, user.userId);
}

@Delete(':id')
async deleteChild(
  @Param('id') childId: string,
  @CurrentUser() user: JwtPayload,
) {
  return this.childService.delete(childId, user.userId);
}
}