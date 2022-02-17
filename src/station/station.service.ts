import { Model } from 'mongoose';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Station, StationDocument } from '../schemas/station.schema';
import { ListAllStationsDto } from '../dto/listAllStations/listAllStations.dto';
import { StationResponseDto } from '../dto/stationResponse.dto';
import { Price, PriceDocument } from '../schemas/price.schema';
import { ListAllStationsForAverageDto } from '../dto/listAllStations/listAllStationsForAverage.dto';
import { GasPriceAverageDto } from '../dto/gasPriceAverage.dto';
import { Order } from "../dto/listAllStations/listAllStationsOrders.dto";

@Injectable()
export class StationService {
  constructor(
    @InjectModel(Station.name) private stationModel: Model<StationDocument>,
    @InjectModel(Price.name) private priceModel: Model<PriceDocument>,
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
   */
  async findOne(id: number): Promise<Station> {
    return this.stationModel
      .findOne({ _id: id })
      .populate({
        path: 'prices',
        select: '-__v -_id',
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
    const pricesPerGas = this.groupBy(prices.flat(), (price) => price.gas_id);
    for (const [gas_id, prices] of pricesPerGas) {
      const totalPrice = prices.reduce((acc, value) => {
        return acc + value.price;
      }, 0);
      priceAveragePerGas.push({
        gas_id: gas_id,
        price_average: parseFloat((totalPrice / prices.length).toFixed(3)),
      });
    }
    return priceAveragePerGas;
  }

  async applyFilter(search: any, query: ListAllStationsDto): Promise<any> {
    //Select columns
    if (query.columns) {
      for (const column of query.columns) {
        if (column == 'id') continue;
        if (['prices', 'schedules'].includes(column)) {
          search.populate({
            path: column,
            select: '-__v -_id',
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
        select: '-__v -_id',
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
      const stations = await this.priceModel
        .find({ gas_name: { $in: query.filters.gasAvailables } }, { _id: 1 })
        .exec();
      const ids = stations.map(function (doc) {
        return doc._id;
      });
      search.find({ prices: { $in: ids } });
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
      for (const [key, value] of Object.entries(query.orders.gas)) {
        search.sort({ [key]: Order[value.toString()] });
      }
    }

    //pagination
    if (query.limit) search.limit(query.limit);
    if (query.offset) search.skip(query.offset);

    return search.exec();
  }

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
}
