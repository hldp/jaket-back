import { Model } from 'mongoose';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Station, StationDocument } from '../schemas/station.shema';

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

  async findAll(): Promise<Station[]> {
    return this.stationModel.find().exec();
  }
}
