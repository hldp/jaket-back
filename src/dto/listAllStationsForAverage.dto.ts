import { ListAllStationsFiltersDto } from './listAllStationsFilters.dto';

export class ListAllStationsForAverageDto {
  filters?: ListAllStationsFiltersDto;
  limit?: number;
  offset?: number;
}
