import { ListAllStationsFiltersDto } from './listAllStationsFilters.dto';

export class ListAllStationsDto {
  columns?: string[];
  filters?: ListAllStationsFiltersDto;
  limit?: number;
  offset?: number;
}
