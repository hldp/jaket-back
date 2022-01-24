import { Module } from '@nestjs/common';
import { StationController } from './station/station.controller';
import { StationService } from './station/station.service';
import { MongooseModule } from '@nestjs/mongoose';
import { Station, StationSchema } from './schemas/station.shema';
import * as dotenv from 'dotenv';

dotenv.config({ path: process.env.DOTENV_CONFIG_PATH ?? '../.env.prod' });

@Module({
  imports: [
    MongooseModule.forRoot(process.env.MONGODB_ADDON_URI),
    MongooseModule.forFeature([{ name: Station.name, schema: StationSchema }]),
  ],
  controllers: [StationController],
  providers: [StationService],
})
export class AppModule {}
