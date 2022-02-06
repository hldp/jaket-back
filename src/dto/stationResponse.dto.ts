import { Station } from '../schemas/station.schema';

export class StationResponseDto {
  limit: number;
  offset: number;
  data: Station[];
}
