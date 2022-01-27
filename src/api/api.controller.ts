import { Controller, Get, Param } from '@nestjs/common';
import { ApiService } from './api.service';

@Controller('api')
export class ApiController {
  constructor(private readonly apiService: ApiService) {}

  @Get('day')
  async getAllDataForDay() {
    return await this.apiService.getAllDataForDay();
  }
}
