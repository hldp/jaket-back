import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { Coordinate } from './coordinate.schema';
import { Price } from './price.schema';
import { Schedule } from './schedule.schema';

export type StationDocument = Station & Document;

@Schema()
export class Station {
  @Prop()
  _id: number;

  @Prop()
  name: string;

  @Prop()
  position: Coordinate;

  @Prop()
  address: string;

  @Prop({ type: [Types.ObjectId], ref: Schedule.name })
  schedules: Schedule[];

  @Prop({ type: [Types.ObjectId], ref: Price.name })
  prices: Price[];
}

export const StationSchema = SchemaFactory.createForClass(Station);
