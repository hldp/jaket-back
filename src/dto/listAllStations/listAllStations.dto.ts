import { ListAllStationsFiltersDto } from './listAllStationsFilters.dto';
import { ListAllStationsOrdersDto } from './listAllStationsOrders.dto';

export class ListAllStationsDto {
  columns?: string[];
  filters?: ListAllStationsFiltersDto;
  orders?: ListAllStationsOrdersDto;
  limit?: number;
  offset?: number;
}
