import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type PriceDocument = Price & Document;

@Schema()
export class Price {
  @Prop()
  gas_id: number;

  @Prop()
  gas_name: string;

  @Prop()
  last_update: Date;

  @Prop()
  price: number;
}

export const PriceSchema = SchemaFactory.createForClass(Price);

PriceSchema.set('toJSON', {
  transform: function (doc, ret) {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
  },
});
