import { Model } from 'mongoose';
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Station, StationDocument } from '../schemas/station.schema';
import { ListAllStationsDto } from '../dto/listAllStations/listAllStations.dto';
import { StationResponseDto } from '../dto/stationResponse.dto';
import { Price, PriceDocument } from '../schemas/price.schema';
import { ListAllStationsForAverageDto } from '../dto/listAllStations/listAllStationsForAverage.dto';
import { GasPriceAverageDto } from '../dto/gasPriceAverage.dto';
import { Order } from '../dto/listAllStations/listAllStationsOrders.dto';
import { PricesTrendsDto } from '../dto/priceTrends/pricesTrends.dto';
import { PriceTrendsPeriodEnum } from '../dto/priceTrends/priceTrendsPeriodEnum';
import { StationOptionsDto } from '../dto/listAllStations/stationOptions.dto';
import {
  PriceTrends,
  PriceTrendsDocument,
} from '../schemas/priceTrends.schema';
import { PeriodPrice } from 'src/dto/periodPrice.dto';
import { PriceHistory } from 'src/dto/priceHistory.dto';

@Injectable()
export class StationService {
  constructor(
    @InjectModel(Station.name) private stationModel: Model<StationDocument>,
    @InjectModel(Price.name) private priceModel: Model<PriceDocument>,
    @InjectModel(PriceTrends.name)
    private priceTrendsModel: Model<PriceTrendsDocument>,
  ) {}

  /**
   * This method allow to get the next id of the object we create
   */
  private async getNextID(): Promise<number> {
    const contracts = await this.stationModel.find({}).exec();
    return contracts.length + 1;
  }

  /**
   * Create a new Station
   * @param name
   */
  async create(name: string): Promise<Station> {
    const station = new this.stationModel();
    station._id = await this.getNextID();
    station.name = name;
    return await station.save();
  }

  /**
   * Return the station corresponding to the id
   * @param id
   * @param options
   */
  async findOne(id: number, options: StationOptionsDto = {}): Promise<Station> {
    let selectPrice = '-__v';

    if (!options.withPriceId) {
      selectPrice += ' -_id';
    }
    return this.stationModel
      .findOne({ _id: id })
      .populate({
        path: 'prices',
        select: selectPrice,
      })
      .populate({
        path: 'schedules',
        select: '-__v -_id',
      })
      .exec();
  }

  /**
   * Find all stations
   * @param query
   */
  async findAll(query: ListAllStationsDto): Promise<StationResponseDto> {
    const data = await this.applyFilter(this.stationModel.find(), query);

    const res = new StationResponseDto();
    if (query.limit) res.limit = +query.limit;
    res.offset = query.offset ?? 0;
    res.nb_items = data.length;
    res.data = data;
    return res;
  }

  /**
   * Find price average for each gas
   * @param query
   */
  async getPriceAverage(
    query: ListAllStationsForAverageDto,
  ): Promise<GasPriceAverageDto[]> {
    const priceAveragePerGas = [];
    const data = await this.applyFilter(this.stationModel.find(), query);
    const prices = data.map((station) => station.prices);
    const pricesPerGas = this.groupBy(prices.flat(), (price) => price.gas_name);
    for (const [gas_name, prices] of pricesPerGas) {
      const totalPrice = prices.reduce((acc, value) => {
        return acc + value.price;
      }, 0);
      priceAveragePerGas.push({
        gas_name: gas_name,
        price_average: parseFloat((totalPrice / prices.length).toFixed(3)),
      });
    }
    return priceAveragePerGas;
  }

  /**
   * Find price trends
   * @param station_id
   * @param query
   * @param saveToDb
   */
  async getPriceTrends(
    station_id: number = null,
    query: PricesTrendsDto,
    saveToDb = false,
  ): Promise<any> {
    let stations = [];
    if (station_id !== null) {
      const station = await this.findOne(station_id, { withPriceId: true });
      if (!station) {
        throw new HttpException(
          "Station doesn't exist !",
          HttpStatus.BAD_REQUEST,
        );
      }
      stations = [station];
    } else {
      let searchQuery = {
        filters: {},
      };
      if (query.position && query.radius) {
        searchQuery = {
          ...searchQuery,
          filters: {
            ...searchQuery.filters,
            area: {
              coordinate: query.position,
              radius: query.radius,
            },
          },
        };
      }
      if (query.gas_names?.length > 0) {
        searchQuery = {
          ...searchQuery,
          filters: {
            ...searchQuery.filters,
            gasAvailables: query.gas_names,
          },
        };
      }
      stations = await this.applyFilter(this.stationModel.find(), searchQuery, {
        withPriceId: true,
      });
    }
    const minDate = StationService.getMinDateByPeriod(query.period);

    let queryParams = {};
    if (minDate) {
      queryParams = {
        last_update: {
          $gte: minDate,
        },
      };
    }

    let evolutionPerStation = [];
    if (stations) {
      const evolutionPromises: Promise<any>[] = stations.map(
        function (station) {
          return this.getEvolutionPerStation(
            queryParams,
            station,
            query.period,
            saveToDb,
          );
        }.bind(this),
      );
      evolutionPerStation = await Promise.all(evolutionPromises);
    }

    // Calcul moyenne de l'évolution des prix des stations
    const evolutions = evolutionPerStation.map((e) => e.evolution);

    const evolutionGroupByGas = this.groupBy(
      evolutions.flat(),
      (ev) => ev.gas_name,
    );

    const evolutionPerGas = { period: query.period, evolutions: [] };
    for (const [gas_name, evolutions] of evolutionGroupByGas) {
      if (query.gas_names.length === 0 || query.gas_names.includes(gas_name)) {
        evolutionPerGas.evolutions.push({
          gas_name: gas_name,
          evolution: (
            evolutions.map((ev) => ev.evolution).reduce((c, n) => c + n) /
            evolutions.length
          ).toFixed(2),
        });
      }
    }

    return evolutionPerGas;
  }

  /**
   * Get evolution price per gas on station
   * @param queryParams
   * @param station
   * @param period
   * @param saveToDb
   * @private
   */
  private async getEvolutionPerStation(
    queryParams: any,
    station,
    period: PriceTrendsPeriodEnum,
    saveToDb = false,
  ) {
    const priceTrends = await this.priceTrendsModel
      .findOne({
        period: period,
        station_id: station.id,
      })
      .exec();
    if (priceTrends && priceTrends.evolution && !saveToDb) {
      return {
        station_id: station.id,
        evolution: priceTrends.evolution,
      };
    }

    const stationPrices = await this.priceModel
      .find({
        ...queryParams,
        station_id: station.id,
        _id: {
          $nin: station.prices.map((price) => price._id),
        },
      })
      .sort({ last_update: 1 })
      .exec();

    // get actual prices per gas
    const actualPrices = station.prices;
    const actualPricesPerGas = this.groupBy(
      actualPrices.flat(),
      (price) => price.gas_name,
    );

    // get previous prices per gas
    const previousPricesPerGas = this.groupBy(
      stationPrices.flat(),
      (price) => price.gas_name,
    );

    const evolutionPerGas = [];
    for (const [gas_name, prices] of actualPricesPerGas) {
      if (previousPricesPerGas.get(gas_name)) {
        const oldestPrice = previousPricesPerGas
          .get(gas_name)
          .reduce((c, n) => {
            return Date.parse(n) < Date.parse(c) ? n : c;
          });

        evolutionPerGas.push({
          gas_name: gas_name,
          evolution: +(
            ((prices[0].price - oldestPrice.price) / oldestPrice.price) *
            100
          ),
        });
      }
    }

    if (priceTrends) {
      priceTrends.evolution = evolutionPerGas;
      await priceTrends.save();
    } else {
      const newpriceTrends = new this.priceTrendsModel();
      newpriceTrends.period = period;
      newpriceTrends.station_id = station.id;
      newpriceTrends.evolution = evolutionPerGas;
      await newpriceTrends.save();
    }

    return {
      station_id: station.id,
      evolution: evolutionPerGas,
    };
  }

  /**
   * Apply filter to search stations
   * @param search
   * @param query
   * @param options
   */
  async applyFilter(
    search: any,
    query: ListAllStationsDto,
    options: StationOptionsDto = {},
  ): Promise<any> {
    let selectPrice = '-__v';

    if (!options.withPriceId) {
      selectPrice += ' -_id';
    }

    //Select columns
    if (query.columns) {
      for (const column of query.columns) {
        if (column == 'id') continue;
        if (['prices', 'schedules'].includes(column)) {
          search.populate({
            path: column,
            select: column === 'prices' ? selectPrice : '-__v -_id',
            options: {
              sort: 'price schedule_id',
            },
          });
          search.select({ '-_id': 1 });
        } else {
          search.select({ [column]: 1 });
        }
      }
    } else {
      search.populate({
        path: 'prices',
        select: selectPrice,
        options: {
          sort: 'price',
        },
      });
      search.populate({
        path: 'schedules',
        select: '-__v -_id',
        options: {
          sort: 'schedule_id',
        },
      });
    }

    //Filter by gas available
    if (query.filters?.gasAvailables) {
      const gasAvaiableConditions = [];
      for (const gas of query.filters?.gasAvailables) {
        gasAvaiableConditions.push({
          ['rawPrices.' + gas]: {
            $exists: true,
          },
        });
      }
      search.find({ $or: gasAvaiableConditions });
    }

    //Filter by location
    if (query.filters?.area) {
      search.find({
        position: {
          $near: {
            $geometry: {
              type: 'Point',
              coordinates: [
                +query.filters.area.coordinate.longitude,
                +query.filters.area.coordinate.latitude,
              ],
            },
            $maxDistance: +query.filters.area.radius,
          },
        },
      });
    }

    //orders
    if (query.orders) {
      if (query.orders.id) {
        search.sort({ _id: Order[query.orders.id] });
      }
      if (query.orders.distance) {
        //this will order by distance
        search.find({
          position: {
            $near: {
              $geometry: {
                type: 'Point',
                coordinates: [
                  +query.orders.distance.longitude,
                  +query.orders.distance.latitude,
                ],
              },
            },
          },
        });
      }
      if (query.orders.gas) {
        for (const [key, value] of Object.entries(query.orders.gas)) {
          search.find({ ['rawPrices.' + key]: { $type: 'number' } });
          search.sort({ ['rawPrices.' + key]: Order[value.toString()] });
        }
      }
    }

    //pagination
    if (query.limit) search.limit(query.limit);
    if (query.offset) search.skip(query.offset);

    return search.exec();
  }

  /**
   * Group list by key
   * @param list
   * @param keyGetter
   * @private
   */
  private groupBy(list, keyGetter) {
    const map = new Map();
    list.forEach((item) => {
      const key = keyGetter(item);
      const collection = map.get(key);
      if (!collection) {
        map.set(key, [item]);
      } else {
        collection.push(item);
      }
    });
    return map;
  }

  /**
   * Get min date for period
   * @param period
   * @private
   */
  private static getMinDateByPeriod(period: PriceTrendsPeriodEnum) {
    const currentDate = new Date();
    const minDate = new Date();
    switch (period) {
      case PriceTrendsPeriodEnum.ALL:
        return null;
      case PriceTrendsPeriodEnum.LAST_YEAR:
        minDate.setFullYear(currentDate.getFullYear() - 1);
        break;
      case PriceTrendsPeriodEnum.LAST_MONTH:
        minDate.setMonth(currentDate.getMonth() - 1);
        break;
      case PriceTrendsPeriodEnum.LAST_WEEK:
        return new Date(
          currentDate.getFullYear(),
          currentDate.getMonth(),
          currentDate.getDate() - 7,
        );
      case PriceTrendsPeriodEnum.LAST_DAY:
        minDate.setMonth(currentDate.getDay() - 1);
        break;
    }
    return minDate;
  }

  async getPriceHistoric(stationID: number, period: PriceTrendsPeriodEnum) {
    const minDate = StationService.getMinDateByPeriod(period);
    let queryParams = {};
    if (minDate) {
      queryParams = {
        last_update: {
          $gte: minDate,
        },
      };
    }
    const stationPrices = await this.priceModel
      .find({
        ...queryParams,
        station_id: stationID,
      })
      .sort({ last_update: 1 })
      .exec();

    const stationPricesFiltered = this.filterStationsPrices(stationPrices);
    return this.adpatHistoricPrices(stationPricesFiltered);
  }

  private filterStationsPrices(stationPrices: any[]) {
    const filteredStationPrices: any[] = [];
    let found = false;

    stationPrices.forEach((price) => {
      for (let i = 0; i < filteredStationPrices.length; i++) {
        if (
          price.gas_id === filteredStationPrices[i].gas_id &&
          price.last_update.getDate() ===
            filteredStationPrices[i].last_update.getDate()
        ) {
          found = true;
        }
      }
      if (!found) {
        filteredStationPrices.push(price);
      }
      found = false;
    });
    return filteredStationPrices;
  }

  private adpatHistoricPrices(stationPrices: any) {
    const data: PriceHistory[] = [];
    let inserted = false;
    stationPrices.forEach((price) => {
      const periodPrice: PeriodPrice = new PeriodPrice();
      periodPrice.date = price.last_update.getDay();
      periodPrice.price = price.price;
      data.forEach((priceHistory) => {
        if (priceHistory.gas === price.gas_name) {
          priceHistory.data.push(periodPrice);
          inserted = true;
        }
      });

      if (!inserted) {
        const newPriceHistory: PriceHistory = new PriceHistory();
        newPriceHistory.gas = price.gas_name;
        newPriceHistory.data = [];
        const periodPrice: PeriodPrice = new PeriodPrice();
        periodPrice.date = price.last_update.getDay();
        periodPrice.price = price.price;
        newPriceHistory.data.push(periodPrice);
        data.push(newPriceHistory);
      }
      inserted = false;
    });

    data.map((priceHistory) => {
      priceHistory.data.sort(
        (periodA, periodB) => parseInt(periodA.date) - parseInt(periodB.date),
      );
    });

    data.map((priceHistory) => {
      if (parseInt(priceHistory.data[0].date) === 0) {
        priceHistory.data.push(priceHistory.data[0]);
        priceHistory.data.splice(0, 1);
      }
    });

    return data;
  }
}
