import { Module } from '@nestjs/common';
import { StationController } from './station/station.controller';
import { StationService } from './station/station.service';
import { MongooseModule } from '@nestjs/mongoose';
import { Station, StationSchema } from './schemas/station.schema';
import * as dotenv from 'dotenv';
import { HttpModule } from '@nestjs/axios';
import { Schedule, ScheduleSchema } from './schemas/schedule.schema';
import { Price, PriceSchema } from './schemas/price.schema';
import { ScheduleModule } from '@nestjs/schedule';
import { OpenDataService } from './import/opendata.service';
import { AppController } from './app.controller';
import { AccountController } from './account/account.controller';
import { AccountService } from './account/account.service';
import { User, UserSchema } from './schemas/user.schema';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { LocalStrategy } from './account/local.strategy';
import { JwtStrategy } from './account/jwt.strategy';
import * as bcrypt from 'bcrypt';

dotenv.config({ path: process.env.DOTENV_CONFIG_PATH ?? './.env' });

@Module({
  imports: [
    MongooseModule.forRoot(process.env.MONGODB_ADDON_URI),
    MongooseModule.forFeature([
      { name: Station.name, schema: StationSchema },
      { name: Schedule.name, schema: ScheduleSchema },
      { name: Price.name, schema: PriceSchema },
    ]),
    MongooseModule.forFeatureAsync([
      {
        name: User.name,
        useFactory: () => {
          const schema = UserSchema;
          UserSchema.pre<User>('save', async function () {
            const salt = await bcrypt.genSalt(10);
            this.password = await bcrypt.hash(this.password, salt);
          });
          return schema;
        },
      },
    ]),
    HttpModule,
    PassportModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: {
        expiresIn: '60s',
      },
    }),
    ScheduleModule.forRoot(),
  ],
  controllers: [StationController, AccountController, AppController],
  providers: [
    StationService,
    AccountService,
    OpenDataService,
    LocalStrategy,
    JwtStrategy,
  ],
})
export class AppModule {}
