import { Controller, Get, Param } from '@nestjs/common';
import { StationService } from './station.service';

@Controller('station')
export class StationController {
  constructor(private readonly stationService: StationService) {}

  @Get()
  async findAll() {
    await this.stationService.create('test');
    return this.stationService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.stationService.findOne(+id);
  }
}
