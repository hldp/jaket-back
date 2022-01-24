import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { Coordinate } from './coordinate.shema';

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
}

export const StationSchema = SchemaFactory.createForClass(Station);