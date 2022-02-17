import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { User, UserDocument } from '../schemas/user.schema';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { FillGasDto } from '../dto/fillGas.dto';
import { UserFillGas } from '../schemas/userFillGas.schema';
import { FillGasStatsPeriodEnum } from '../dto/fillGasStatsPeriodEnum';

@Injectable()
export class AccountService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(UserFillGas.name)
    private userFillGasModel: Model<UserFillGas>,
    private jwtService: JwtService,
  ) {}

  async validateUser(username: string, password: string): Promise<any> {
    const user = await this.findOne(username);
    if (user) {
      const isMatch = await bcrypt.compare(password, user.password);
      if (isMatch) {
        return user;
      }
    }
    return null;
  }

  async findOne(username: string): Promise<User> {
    return await this.userModel.findOne({ username: username }).exec();
  }

  async login(user: any) {
    const payload = { username: user.username, sub: user._id };
    return {
      access_token: this.jwtService.sign(payload),
    };
  }

  async register(username: string, password: string): Promise<boolean> {
    const existingUser = await this.findOne(username);
    if (existingUser) {
      throw new HttpException(
        'Username already used !',
        HttpStatus.BAD_REQUEST,
      );
    }

    const user = new this.userModel();
    user._id = await this.getNextID();
    user.username = username;
    user.password = password;
    await user.save();
    return true;
  }

  async fillGas(user_id: number, fillGas: FillGasDto): Promise<boolean> {
    const userFillGas = new this.userFillGasModel();
    userFillGas.user_id = user_id;
    userFillGas.gas_id = fillGas.gas_id;
    userFillGas.station_id = fillGas.station_id ?? null;
    userFillGas.date = fillGas.date !== null ? fillGas.date : new Date();
    userFillGas.quantity = fillGas.quantity;
    userFillGas.total_price = fillGas.total_price;
    await userFillGas.save();
    return true;
  }

  async fillGasStats(user_id: number, period: FillGasStatsPeriodEnum) {
    const minDate = new Date();
    const currentDate = new Date();
    let queryParams = {};
    if (period === FillGasStatsPeriodEnum.LAST_YEAR) {
      minDate.setFullYear(currentDate.getFullYear() - 1);
    } else if (period === FillGasStatsPeriodEnum.LAST_MONTH) {
      minDate.setMonth(currentDate.getMonth() - 1);
    }

    if (period !== FillGasStatsPeriodEnum.ALL) {
      queryParams = {
        date: {
          $gte: minDate,
        },
      };
    }

    const usersFillGas = await this.userFillGasModel
      .find({
        user_id: user_id,
        ...queryParams,
      })
      .exec();

    let sumAverageLiterPrice = 0;
    usersFillGas.forEach((userFillGas) => {
      sumAverageLiterPrice += userFillGas.total_price / userFillGas.quantity;
    });

    return {
      averageLiterPrice: +sumAverageLiterPrice / usersFillGas.length,
    };
  }

  /**
   * This method allow to get the next id of the object we create
   */
  private async getNextID(): Promise<number> {
    const users = await this.userModel.find({}).exec();
    return users.length + 1;
  }

  async validateUserByIdAndUsername(requestUser: {
    _id: number;
    username: string;
  }): Promise<void> {
    const user = await this.userModel
      .findOne({ username: requestUser.username, _id: requestUser._id })
      .exec();
    if (!user) {
      throw new HttpException("User doesn't exist !", HttpStatus.FORBIDDEN);
    }
  }
}
