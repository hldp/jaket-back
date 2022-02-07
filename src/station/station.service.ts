import { Model } from 'mongoose';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Station, StationDocument } from '../schemas/station.schema';
import { ListAllStationsDto } from '../dto/listAllStations.dto';
import { StationResponseDto } from '../dto/stationResponse.dto';
import { Price, PriceDocument } from '../schemas/price.schema';

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
    return await this.stationModel.findOne({ _id: id }).exec();
  }

  /**
   * Find all stations
   * @param query
   */
  async findAll(query: ListAllStationsDto): Promise<StationResponseDto> {
    const data = await this.applyFilter(this.stationModel.find(), query);

    const res = new StationResponseDto();
    res.limit = query.limit ?? data.lenght;
    res.offset = query.offset ?? 0;
    res.data = data;
    return res;
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
      });
      search.populate({
        path: 'schedules',
        select: '-__v -_id',
      });
    }

    //Filter by gas available
    if (query.filters?.gazAvailables) {
      const stations = await this.priceModel
        .find({ gaz_id: { $in: query.filters.gazAvailables } }, { _id: 1 })
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
              coordinates: query.filters.area.coordinate,
            },
            $maxDistance: query.filters.area.radius,
          },
        },
      });
    }

    //pagination
    if (query.limit) search.limit(query.limit);
    if (query.offset) search.skip(query.offset);

    return search.exec();
  }
}
