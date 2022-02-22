import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { Point } from '../dto/point.dto';
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
  position: Point;

  @Prop()
  address: string;

  @Prop({ type: [Types.ObjectId], ref: Schedule.name })
  schedules: Schedule[];

  @Prop()
  rawPrices: Map<string, number>;

  @Prop({ type: [Types.ObjectId], ref: Price.name })
  prices: Price[];
}

export const StationSchema = SchemaFactory.createForClass(Station);

StationSchema.index({ position: '2dsphere' });

StationSchema.set('toJSON', {
  transform: function (doc, ret) {
    ret.id = ret._id;
    if (ret.position) {
      ret.position = {
        longitude: ret.position.coordinates[0],
        latitude: ret.position.coordinates[1],
      };
    }
    delete ret.rawPrices;
    delete ret._id;
    delete ret.__v;
  },
});
