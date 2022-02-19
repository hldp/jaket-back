import { Coordinate } from './coordinate.model';
import { PriceTrendsPeriodEnum } from './priceTrendsPeriodEnum';

export class PricesTrendsDto {
  gas_name?: string;
  position?: Coordinate;
  radius?: number;
  period: PriceTrendsPeriodEnum;
}
