import { Model } from 'mongoose';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Station, StationDocument } from '../schemas/station.schema';
import { Price, PriceDocument } from '../schemas/price.schema';
import { Schedule, ScheduleDocument } from '../schemas/schedule.schema';
import { HttpService } from '@nestjs/axios';
import { map } from 'rxjs';
import * as Zip from 'adm-zip';
import { XMLParser } from 'fast-xml-parser';
import { Iconv } from 'iconv';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Point } from '../dto/point.dto';

@Injectable()
export class OpenDataService {
  static readonly API_BASE_URL = 'https://donnees.roulez-eco.fr';
  static readonly API_ENCODING = 'ISO-8859-1';

  constructor(
    @InjectModel(Station.name) private stationModel: Model<StationDocument>,
    @InjectModel(Price.name) private priceModel: Model<PriceDocument>,
    @InjectModel(Schedule.name) private scheduleModel: Model<ScheduleDocument>,
    private httpService: HttpService,
  ) {}

  /**
   * Fetch stations from gov open data
   */
  @Cron(CronExpression.EVERY_DAY_AT_1AM)
  async fetchFromOpenData(): Promise<void> {
    await this.httpService
      .get(OpenDataService.API_BASE_URL + '/opendata/instantane', {
        responseType: 'arraybuffer',
      })
      .pipe(
        map((response) => {
          return response.data;
        }),
      )
      .subscribe(async (response) => {
        console.log('Fetching xml...');
        const result = this.parseOpenDataZipToJson(response, '@_');
        const rawStations = result.pdv_liste.pdv;
        const saveActions: Promise<Station>[] = rawStations.map(
          function (rawStation) {
            return this.saveStation(rawStation);
          }.bind(this),
        );
        console.log('Saving...');
        await Promise.all(saveActions);
        console.log('Done!');
      });
  }

  /**
   *
   * @param rawPrice
   */
  savePrice(rawPrice: any): Price {
    const price = new this.priceModel();
    price.gas_id = rawPrice['@_id'];
    price.gas_name = rawPrice['@_nom'];
    price.last_update = new Date(rawPrice['@_maj']);
    price.price = rawPrice['@_valeur'];
    price.save();
    return price;
  }

  saveSchedule(rawSchedule: any): Schedule {
    const schedule = new this.scheduleModel();
    schedule.schedule_id = rawSchedule['@_id'];
    schedule.day = rawSchedule['@_nom'];
    schedule.open = rawSchedule['@_ferme'] == '';
    schedule.opening = rawSchedule.horaire
      ? rawSchedule.horaire['@_ouverture'] ?? ''
      : '';
    schedule.closing = rawSchedule.horaire
      ? rawSchedule.horaire['@_fermeture'] ?? ''
      : '';
    schedule.save();
    return schedule;
  }

  /**
   * Save a raw station in db
   * @param rawStation
   */
  async saveStation(rawStation: any): Promise<void> {
    let station = await this.stationModel
      .findOne({ _id: rawStation['@_id'] })
      .exec();
    if (station == null) {
      station = new this.stationModel();
    }
    //Extract general data
    station._id = rawStation['@_id'];
    station.name = '';
    //fix string to number xml conversion
    const zipcode =
      rawStation['@_cp'] < 10000
        ? '0' + rawStation['@_cp']
        : rawStation['@_cp'];
    station.address = `${rawStation.adresse}, ${zipcode} ${rawStation.ville}`;

    const point = new Point();
    point.type = 'Point';
    point.coordinates = [
      rawStation['@_longitude'] / 1e5,
      rawStation['@_latitude'] / 1e5,
    ];
    station.position = point;

    //Extract prices
    const prices = [];
    station.rawPrices = new Map<string, number>();
    if (rawStation.prix && rawStation.prix.length > 0) {
      const savePrices: Promise<Price>[] = rawStation.prix.map(
        function (rawPrice) {
          station.rawPrices.set(rawPrice['@_nom'], rawPrice['@_valeur']);
          prices.push(this.savePrice(rawPrice));
        }.bind(this),
      );
      await Promise.all(savePrices);
    }
    console.log(station.rawPrices);
    station.prices = prices;

    //Extract schedules
    const schedules = [];
    if (
      rawStation.horaires &&
      rawStation.horaires.jour &&
      rawStation.horaires.jour.length > 0
    ) {
      const saveSchedules: Promise<Schedule>[] = rawStation.horaires.jour.map(
        function (rawSchedule) {
          schedules.push(this.saveSchedule(rawSchedule));
        }.bind(this),
      );
      await Promise.all(saveSchedules);
    }
    station.schedules = schedules;

    await station.save();
  }

  /**
   * Parse a file to Json
   * @param response
   * @param prefix
   */
  parseOpenDataZipToJson(response: Buffer, prefix: string) {
    const zip = new Zip(response);
    const zipEntries = zip.getEntries();
    const zipEntry = zipEntries[0];
    const decompressedXml = zip.readFile(zipEntry);
    const decompressedXmlDecoded = new Iconv(
      OpenDataService.API_ENCODING,
      'UTF-8',
    ).convert(decompressedXml);
    const options = {
      ignoreAttributes: false,
      attributeNamePrefix: prefix,
      allowBooleanAttributes: true,
      parseAttributeValue: true,
    };
    const parser = new XMLParser(options);
    return parser.parse(decompressedXmlDecoded);
  }
}
