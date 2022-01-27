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
  @Cron(CronExpression.EVERY_4_HOURS)
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
        console.log('Fetching xlm...');
        const result = this.parseOpenDataZipToJson(response, '@_');
        const rawStations = result.pdv_liste.pdv;
        const saveActions: Promise<Station>[] = rawStations.map(
          function (rawStation) {
            this.saveStation(rawStation);
          }.bind(this),
        );
        console.log('Saving...');
        await Promise.all(saveActions);
        console.log('Done!');
      });
  }

  /**
   * Save a raw station in db
   * @param rawStation
   */
  async saveStation(rawStation: any): Promise<Station> {
    let station = await this.stationModel
      .findOne({ _id: rawStation['@_id'] })
      .exec();
    if (station == null) {
      station = new this.stationModel();
    }
    //Extract general data
    station._id = rawStation['@_id'];
    station.name = '';
    station.address = rawStation.adresse;
    station.position = {
      latitude: rawStation['@_latitude'],
      longitude: rawStation['@_longitude'],
    };

    //Extract prices
    const prices = [];
    if (rawStation.prix && rawStation.prix.length > 0) {
      for (const prix of rawStation.prix) {
        const price = new this.priceModel();
        price.gaz_id = prix['@_id'];
        price.gaz_name = prix['@_nom'];
        price.last_update = new Date(prix['@_maj']);
        price.price = prix['@_valeur'];
        await price.save();
        prices.push(price);
      }
    }
    station.prices = prices;

    //Extract schedules
    const schedules = [];
    if (
      rawStation.horaires &&
      rawStation.horaires.jour &&
      rawStation.horaires.jour.length > 0
    ) {
      for (const jour of rawStation.horaires.jour) {
        const schedule = new this.scheduleModel();
        schedule.schedule_id = jour['@_id'];
        schedule.day = jour['@_nom'];
        schedule.open = jour['@_ferme'] == '';
        schedule.opening = jour.horaire
          ? jour.horaire['@_ouverture'] ?? ''
          : '';
        schedule.closing = jour.horaire
          ? jour.horaire['@_fermeture'] ?? ''
          : '';
        await schedule.save();
        schedules.push(schedule);
      }
    }
    station.schedules = schedules;

    await station.save();
    return station;
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
