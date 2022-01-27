import { Controller, Get, Param } from '@nestjs/common';
import { StationService } from './station.service';
import { OpenDataService } from '../import/opendata.service';

@Controller('station')
export class StationController {
  constructor(
    private readonly stationService: StationService,
    private readonly openDataService: OpenDataService,
  ) {}

  @Get()
  async findAll() {
    await this.stationService.create('test');
    return this.stationService.findAll();
  }

  @Get('/fetch')
  async fetchAll() {
    await this.openDataService.fetchFromOpenData();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.stationService.findOne(+id);
  }
}
