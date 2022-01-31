import { Model } from 'mongoose';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Station, StationDocument } from '../schemas/station.schema';
import {ListAllStationsDto} from "../dto/ListAllStations.dto";

@Injectable()
export class StationService {
  constructor(
    @InjectModel(Station.name) private stationModel: Model<StationDocument>,
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
  async findAll(query: ListAllStationsDto): Promise<Station[]> {
    const search = this.stationModel.find();

    //Select columns
    if (query.columns) {
      for (const column of query.columns) {
        if (['prices', 'schedules'].includes(column)) {
          search.populate({
            path: column,
            select: '-__v -_id',
          });
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

    search.select({ '-__v': 0 });

    //pagination
    if (query.limit) search.limit(query.limit);
    if (query.limit) search.skip(query.offset);

    return search.exec();
  }
}
