import { ListAllStationsFiltersByAreaDto } from './listAllStationsFiltersByArea.dto';

export class ListAllStationsFiltersDto {
  gazAvailables?: number[];
  area?: ListAllStationsFiltersByAreaDto;
}
