import { ListAllStationsFiltersByAreaDto } from './ListAllStationsFiltersByArea.dto';

export class ListAllStationsFiltersDto {
  maxPrice?: number;
  minPrice?: number;
  gazAvailables?: number[];
  area?: ListAllStationsFiltersByAreaDto;
}
