import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger } from '@nestjs/common';
import * as dotenv from 'dotenv';

dotenv.config({ path: process.env.DOTENV_CONFIG_PATH ?? '.env.prod' });

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  await app.listen(process.env.PORT);
  new Logger('NestApplication').log(`Starting on PORT ${process.env.PORT}`);
}
bootstrap();
