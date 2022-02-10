import {
  Controller,
  UseGuards,
  Post,
  Request,
  Get,
  Body,
} from '@nestjs/common';
import { AccountService } from './account.service';
import { LocalAuthGuard } from './local-auth.guard';
import { JwtAuthGuard } from './jwt-auth.guard';

@Controller('')
export class AccountController {
  constructor(private readonly accountService: AccountService) {}

  @UseGuards(LocalAuthGuard)
  @Post('/login')
  async login(@Request() req) {
    return this.accountService.login(req.user);
  }

  @UseGuards(JwtAuthGuard)
  @Get('/stats')
  async getStats() {
    return true;
  }

  @Post('/register')
  async register(
    @Body() query: { username: string; password: string },
  ): Promise<boolean> {
    return this.accountService.register(query.username, query.password);
  }
}
