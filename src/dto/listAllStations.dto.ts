import { ListAllStationsFiltersDto } from './ListAllStationsFilters.dto';

export class ListAllStationsDto {
  columns?: string[];
  filters?: ListAllStationsFiltersDto;
  limit?: number;
  offset?: number;
}
