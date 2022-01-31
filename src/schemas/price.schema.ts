import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type PriceDocument = Price & Document;

@Schema()
export class Price {
  @Prop()
  gaz_id: number;

  @Prop()
  gaz_name: string;

  @Prop()
  last_update: Date;

  @Prop()
  price: number;
}

export const PriceSchema = SchemaFactory.createForClass(Price);
