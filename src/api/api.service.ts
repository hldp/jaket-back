import { Model } from 'mongoose';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Station, StationDocument } from '../schemas/station.shema';
import { HttpService } from '@nestjs/axios';
import { map } from 'rxjs';
import { XMLParser } from 'fast-xml-parser';
import * as Zip from 'adm-zip';
import { Price, PriceDocument } from '../schemas/price.schema';
import { Schedule, ScheduleDocument } from '../schemas/schedule.schema';
import { Cron } from '@nestjs/schedule';

@Injectable()
export class ApiService {
  constructor(
    @InjectModel(Station.name) private stationModel: Model<StationDocument>,
    @InjectModel(Price.name) private priceModel: Model<PriceDocument>,
    @InjectModel(Schedule.name) private scheduleModel: Model<ScheduleDocument>,
    private httpService: HttpService,
  ) {}

  async getAllDataForDay(): Promise<void> {
    this.httpService
      .get('https://donnees.roulez-eco.fr/opendata/jour', {
        responseType: 'arraybuffer',
      })
      .pipe(
        map((response) => {
          return response.data;
        }),
      )
      .subscribe(async (response) => {
        const result = this.parseFileToJson(response);
        for (const pdv of result.pdv_liste.pdv) {
          let station = await this.stationModel
            .findOne({ _id: pdv['@_id'] })
            .exec();
          if (station == null) {
            station = new this.stationModel();
          }
          const prices = [];
          const schedules = [];
          if (pdv.prix && pdv.prix.length > 0) {
            for (const prix of pdv.prix) {
              const price = new this.priceModel();
              price.gaz_id = prix['@_id'];
              price.gaz_name = prix['@_nom'];
              price.last_update = new Date(prix['@_maj']);
              price.price = prix['@_valeur'];
              await price.save();
              prices.push(price);
            }
          }

          if (
            pdv.horaires &&
            pdv.horaires.jour &&
            pdv.horaires.jour.length > 0
          ) {
            for (const jour of pdv.horaires.jour) {
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

          station._id = pdv['@_id'];
          station.name = '';
          station.address = pdv.adresse;
          station.prices = prices;
          station.schedules = schedules;
          station.position = {
            latitude: pdv['@_latitude'],
            longitude: pdv['@_longitude'],
          };
          await station.save();
        }
        console.log('Finish fetching data !');
      });
  }

  parseFileToJson(response: Buffer) {
    const zip = new Zip(response);
    const zipEntries = zip.getEntries();
    const zipEntry = zipEntries[0];
    const decompressedXml = zip.readFile(zipEntry);
    const options = {
      ignoreAttributes: false,
      attributeNamePrefix: '@_',
      allowBooleanAttributes: true,
      parseAttributeValue: true,
    };
    const parser = new XMLParser(options);
    return parser.parse(decompressedXml);
  }

  @Cron('* 0 0 * * *')
  async handleCron() {
    await this.getAllDataForDay();
  }
}
