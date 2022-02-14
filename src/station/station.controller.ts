import { Controller, Get, Param, Query } from '@nestjs/common';
import { StationService } from './station.service';
import { OpenDataService } from '../import/opendata.service';
import { ListAllStationsDto } from '../dto/listAllStations.dto';
import { ListAllStationsForAverageDto } from '../dto/listAllStationsForAverage.dto';

@Controller('stations')
export class StationController {
  constructor(
    private readonly stationService: StationService,
    private readonly openDataService: OpenDataService,
  ) {}

  @Get()
  async findAll(@Query() query: ListAllStationsDto) {
    console.log(query);
    return this.stationService.findAll(query);
  }

  @Get('/prices/average')
  async getPriceAverage(@Query() query: ListAllStationsForAverageDto) {
    return this.stationService.getPriceAverage(query);
  }

  @Get('/prices/trends')
  async getPriceTrends(@Query() query: ListAllStationsForAverageDto) {
    return this.stationService.getPriceAverage(query);
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
  findOne(@Param('id') id: number) {
    return this.stationService.findOne(id);
  }
}
