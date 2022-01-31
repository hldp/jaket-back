import { Coordinate } from '../schemas/coordinate.schema';

export class ListAllStationsFiltersByAreaDto {
  coordinate: Coordinate;
  radius: number;
}
