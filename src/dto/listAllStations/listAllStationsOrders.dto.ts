import { Coordinate } from '../coordinate.model';

export enum Order {
  asc = 1,
  desc = -1,
}

export interface GasOrder {
  [gas_name: string]: Order;
}

export class ListAllStationsOrdersDto {
  gas?: GasOrder[];
  distance?: Coordinate;
  id?: Order;
}
