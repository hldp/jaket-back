import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type UserFillGasDocument = UserFillGas & Document;

@Schema()
export class UserFillGas {
  @Prop()
  user_id: number;

  @Prop()
  gas_id: number;

  @Prop()
  station_id?: number;

  @Prop()
  date: Date;

  @Prop()
  quantity: number;

  @Prop()
  total_price: number;
}

export const UserFillGasSchema = SchemaFactory.createForClass(UserFillGas);

UserFillGasSchema.set('toJSON', {
  transform: function (doc, ret) {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
  },
});
