import { Module } from '@nestjs/common';
import { StationController } from './station/station.controller';
import { StationService } from './station/station.service';
import { MongooseModule } from '@nestjs/mongoose';
import { Station, StationSchema } from './schemas/station.shema';
import * as dotenv from 'dotenv';
import { HttpModule } from '@nestjs/axios';
import { Schedule, ScheduleSchema } from './schemas/schedule.schema';
import { Price, PriceSchema } from './schemas/price.schema';
import { ApiController } from './api/api.controller';
import { ApiService } from './api/api.service';
import { ScheduleModule } from '@nestjs/schedule';

dotenv.config({ path: process.env.DOTENV_CONFIG_PATH ?? '../.env.prod' });

@Module({
  imports: [
    MongooseModule.forRoot(process.env.MONGODB_ADDON_URI),
    MongooseModule.forFeature([
      { name: Station.name, schema: StationSchema },
      { name: Schedule.name, schema: ScheduleSchema },
      { name: Price.name, schema: PriceSchema },
    ]),
    HttpModule,
    ScheduleModule.forRoot(),
  ],
  controllers: [StationController, ApiController],
  providers: [StationService, ApiService],
})
export class AppModule {}
