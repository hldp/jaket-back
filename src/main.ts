import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger } from '@nestjs/common';
import * as dotenv from 'dotenv';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

dotenv.config({ path: process.env.DOTENV_CONFIG_PATH ?? '.env.prod' });

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const config = new DocumentBuilder()
    .setTitle('Jaket API')
    .setDescription('The jaket API description')
    .setVersion('1.0')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('/api', app, document);
  
  console.log(process.env.PORT);
  console.log(process.env);

  await app.listen(process.env.PORT || 8080, '0.0.0.0');
  new Logger('NestApplication').log(`Starting on PORT ${process.env.PORT}`);
}
bootstrap();
