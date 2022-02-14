import { Station } from '../schemas/station.schema';

export class StationResponseDto {
  limit?: number;
  offset: number;
  nb_items: number;
  data: Station[];
}
