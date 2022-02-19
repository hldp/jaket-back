import * as request from 'supertest';
import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from '../src/app.module';
import { INestApplication } from '@nestjs/common';

function distanceBetweenCoordinatesInMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
) {
  const p = 0.017453292519943295; // Math.PI / 180
  const c = Math.cos;
  const a =
    0.5 -
    c((lat2 - lat1) * p) / 2 +
    (c(lat1 * p) * c(lat2 * p) * (1 - c((lon2 - lon1) * p))) / 2;

  return 12742000 * Math.asin(Math.sqrt(a)); // 2 * R; R = 6371 km
}

describe('StationController (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    console.log(app);
    await app.init();
  });

  describe('/stations (GET)', function () {
    it('Choose format', async () => {
      const columns = ['id' /*always here*/, 'name', 'prices'];
      const response = await request(app.getHttpServer())
        .get('/stations')
        .send({
          limit: 1,
          columns: columns,
        });
      expect(response.status).toEqual(200);
      const columnsResponse = Object.keys(response.body.data[0]);
      for (const column of columns) {
        expect(columnsResponse).toContain(column);
      }
    });

    it('Filter by position', async () => {
      const center = {
        longitude: 7.125102,
        latitude: 43.580418,
      };
      const radius = 1000;
      const response = await request(app.getHttpServer())
        .get('/stations')
        .send({
          limit: 10,
          filters: {
            area: {
              coordinate: center,
              radius: radius,
            },
          },
        });
      expect(response.status).toEqual(200);
      for (const station of response.body.data) {
        expect(
          distanceBetweenCoordinatesInMeters(
            center.latitude,
            center.longitude,
            station.position.latitude,
            station.position.longitude,
          ),
        ).toBeLessThanOrEqual(radius);
      }
    });

    it('Filter by gas available', async () => {
      const gasAvailables = ['Gazole', 'SP98'];
      const response = await request(app.getHttpServer())
        .get('/stations')
        .send({
          limit: 10,
          filters: {
            gasAvailables: gasAvailables,
          },
        });
      expect(response.status).toEqual(200);
      for (const station of response.body.data) {
        expect(
          station.prices.filter((value) => gasAvailables.includes(value)),
        ).toBeTruthy();
      }
    });
  });

  afterAll(async () => {
    await app.close();
  });
});
