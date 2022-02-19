import { Coordinate } from './coordinate.model';
import { PriceTrendsPeriodEnum } from './priceTrendsPeriodEnum';

export class PricesTrendsDto {
  gas_names?: string[] = [];
  position?: Coordinate;
  radius?: number;
  period: PriceTrendsPeriodEnum;
}
