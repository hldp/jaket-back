import { UserFillGas } from '../schemas/userFillGas.schema';

export class FillGasStatsDto {
  gas_name: string;
  nbFill: number;
  averageLiterPrice: number;
  list: UserFillGas[];
}
