import { Controller, UseGuards, Post, Request, Body } from '@nestjs/common';
import { AccountService } from './account.service';
import { LocalAuthGuard } from './local-auth.guard';
import { JwtAuthGuard } from './jwt-auth.guard';
import { FillGasDto } from '../dto/fillGas.dto';

@Controller('')
export class AccountController {
  constructor(private readonly accountService: AccountService) {}

  @UseGuards(LocalAuthGuard)
  @Post('/login')
  async login(@Request() req) {
    return this.accountService.login(req.user);
  }

  @Post('/user/fillGas')
  @UseGuards(JwtAuthGuard)
  async fillGas(@Body() query: FillGasDto, @Request() req): Promise<boolean> {
    await this.accountService.validateUserByIdAndUsername(req.user);
    return await this.accountService.fillGas(req.user._id, query);
  }

  @Post('/register')
  async register(
    @Body() query: { username: string; password: string },
  ): Promise<boolean> {
    return this.accountService.register(query.username, query.password);
  }
}
