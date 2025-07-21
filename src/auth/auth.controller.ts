import { Body, Controller, Delete, Get, Patch, Post, Put, Query, Req, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { SignupDto } from './dtos/signup.dto';
import { LoginDto } from './dtos/login.dto';
import { RefreshTokenDto } from './dtos/refresh-tokens.dto';
import { ChangePasswordDto } from './dtos/change-password.dto';
import { AuthenticationGuard } from 'src/guards/authentication.guard';
import { ForgotPasswordDto } from './dtos/forgot-password.dto';
import { ResetPasswordDto } from './dtos/reset-password.dto';
import { UpdateUserDto } from './dtos/update-user.dto';
import { JwtPayload } from 'src/types/jwt-payload.interface';
import { CurrentUser } from 'src/decorators/current-user.decorator';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('signup')
  async signUp(@Body() signupData: SignupDto) {
    return this.authService.signup(signupData);
  }

  @Post('login')
  async login(@Body() credentials: LoginDto) {
    return this.authService.login(credentials);
  }

  @Get('verify-email')
async verifyEmail(@Query('token') token: string) {
  return this.authService.verifyEmail(token);
}

  @Post('refresh')
  async refreshTokens(@Body() refreshTokenDto: RefreshTokenDto) {
    return this.authService.refreshTokens(refreshTokenDto.refreshToken);
  }

  @UseGuards(AuthenticationGuard)
@Put('change-password')
async changePassword(
  @Body() dto: ChangePasswordDto,
  @CurrentUser() user: JwtPayload,
) {
  return this.authService.changePassword(user.userId, dto.oldPassword, dto.newPassword);
}

  @Post('forgot-password')
  async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
    return this.authService.forgotPassword(forgotPasswordDto.email);
  }

  @Put('reset-password')
  async resetPassword(
    @Body() resetPasswordDto: ResetPasswordDto,
  ) {
    return this.authService.resetPassword(
      resetPasswordDto.newPassword,
      resetPasswordDto.resetToken,
    );
  }

  @UseGuards(AuthenticationGuard)
@Patch('profile')
async updateProfile(
  @Body() dto: UpdateUserDto,
  @CurrentUser() user: JwtPayload,
) {
  return this.authService.updateUser(user.userId, dto);
}

@Post('logout')
async logout(@Body('refreshToken') token: string) {
  return this.authService.logout(token);
}

@UseGuards(AuthenticationGuard)
@Delete('profile')
async deleteProfile(@CurrentUser() user: JwtPayload) {
  return this.authService.deleteUserAccount(user.userId);
}
}
