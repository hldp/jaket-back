import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type ScheduleDocument = Schedule & Document;

@Schema()
export class Schedule {
  @Prop()
  schedule_id: number;

  @Prop()
  day: string;

  @Prop()
  open: boolean;

  @Prop()
  opening: string;

  @Prop()
  closing: string;
}

export const ScheduleSchema = SchemaFactory.createForClass(Schedule);
