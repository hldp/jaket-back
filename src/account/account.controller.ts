import {
  Controller,
  UseGuards,
  Post,
  Request,
  Body,
  Get,
  Query,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { AccountService } from './account.service';
import { LocalAuthGuard } from './local-auth.guard';
import { JwtAuthGuard } from './jwt-auth.guard';
import { FillGasDto } from '../dto/fillGas/fillGas.dto';
import { FillGasStatsDto } from '../dto/fillGas/fillGasStats.dto';
import { FillGasStatsPeriodEnum } from '../dto/fillGas/fillGasStatsPeriodEnum';

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

  @Get('/user/stats/fillGas')
  @UseGuards(JwtAuthGuard)
  async fillGasStats(
    @Request() req,
    @Query() query: { period: FillGasStatsPeriodEnum },
  ): Promise<FillGasStatsDto[]> {
    if (!Object.values(FillGasStatsPeriodEnum).includes(query.period)) {
      throw new HttpException('Period is not valid !', HttpStatus.BAD_REQUEST);
    }
    await this.accountService.validateUserByIdAndUsername(req.user);
    return await this.accountService.fillGasStats(req.user._id, query.period);
  }

  @Post('/register')
  async register(
    @Body() query: { username: string; password: string },
  ): Promise<boolean> {
    return this.accountService.register(query.username, query.password);
  }
}
