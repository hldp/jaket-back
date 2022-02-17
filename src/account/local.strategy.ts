import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-local';
import { AccountService } from './account.service';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(private accountService: AccountService) {
    super();
  }

  async validate(username: string, password: string): Promise<any> {
    const user = await this.accountService.validateUser(username, password);
    if (!user) {
      throw new HttpException(
        'Username or password is not valid !',
        HttpStatus.UNAUTHORIZED,
      );
    }
    return user;
  }
}
