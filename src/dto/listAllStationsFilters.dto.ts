import { ListAllStationsFiltersByAreaDto } from './ListAllStationsFiltersByArea.dto';

export class ListAllStationsFiltersDto {
  gazAvailables?: number[];
  area?: ListAllStationsFiltersByAreaDto;
}
