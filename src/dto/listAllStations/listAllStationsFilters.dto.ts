import { ListAllStationsFiltersByAreaDto } from './listAllStationsFiltersByArea.dto';

export class ListAllStationsFiltersDto {
  gasAvailables?: string[];
  area?: ListAllStationsFiltersByAreaDto;
}
