import { ListAllStationsFiltersByAreaDto } from './listAllStationsFiltersByArea.dto';

export class ListAllStationsFiltersDto {
  gasAvailables?: number[];
  area?: ListAllStationsFiltersByAreaDto;
}
