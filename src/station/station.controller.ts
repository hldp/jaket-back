import { Controller, Get, Param, Body } from '@nestjs/common';
import { StationService } from './station.service';
import { OpenDataService } from '../import/opendata.service';
import { ListAllStationsDto } from '../dto/listAllStations.dto';

@Controller('stations')
export class StationController {
  constructor(
    private readonly stationService: StationService,
    private readonly openDataService: OpenDataService,
  ) {}

  @Get()
  async findAll(@Body() query: ListAllStationsDto) {
    return this.stationService.findAll(query);
  }

  @Get('/createOne')
  async createOne() {
    await this.stationService.create('test');
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
