import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { PriceTrendsPeriodEnum } from '../dto/priceTrendsPeriodEnum';

export type PriceTrendsDocument = PriceTrends & Document;

@Schema()
export class PriceTrends {
  @Prop()
  period: PriceTrendsPeriodEnum;

  @Prop()
  station_id: number;

  @Prop()
  evolution: { gas_name: string; evolution: number }[];
}

export const PriceTrendsSchema = SchemaFactory.createForClass(PriceTrends);

PriceTrendsSchema.set('toJSON', {
  transform: function (doc, ret) {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
  },
});
