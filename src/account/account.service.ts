import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { User, UserDocument } from '../schemas/user.schema';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AccountService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private jwtService: JwtService,
  ) {}

  async validateUser(username: string, password: string): Promise<any> {
    const user = await this.findOne(username);
    if (user) {
      const isMatch = await bcrypt.compare(password, user.password);
      if (isMatch) {
        const { password, ...result } = user;
        return result;
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

  /**
   * This method allow to get the next id of the object we create
   */
  private async getNextID(): Promise<number> {
    const users = await this.userModel.find({}).exec();
    return users.length + 1;
  }
}
