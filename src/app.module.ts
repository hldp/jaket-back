import { Module } from '@nestjs/common';
import { StationController } from './station/station.controller';
import { StationService } from './station/station.service';
import { MongooseModule } from '@nestjs/mongoose';
import { Station, StationSchema } from './schemas/station.schema';
import * as dotenv from 'dotenv';
import { HttpModule } from '@nestjs/axios';
import { Schedule, ScheduleSchema } from './schemas/schedule.schema';
import { Price, PriceSchema } from './schemas/price.schema';
import { ScheduleModule } from '@nestjs/schedule';
import { OpenDataService } from './import/opendata.service';
import { AppController } from './app.controller';

dotenv.config({ path: process.env.DOTENV_CONFIG_PATH ?? './.env' });

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
  controllers: [StationController, AppController],
  providers: [StationService, OpenDataService],
})
export class AppModule {}
