import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as dotenv from 'dotenv';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';

dotenv.config();

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Serve Flutter web build
  app.useStaticAssets(join(__dirname, '..', 'public', 'flutter_web'));

  // CORS configuration (already supports Flutter web requests)
  app.enableCors({
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  // API routes configuration
  app.setGlobalPrefix('api/v1');
  
  const config = new DocumentBuilder()
    .setTitle('Integral API')
    .setDescription('API para la aplicación Integral')
    .setVersion('1.0')
    .addBearerAuth()
    //.addTag('API')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/v1/docs', app, document);
  const port = process.env.PORT || 3001;
  await app.listen(port, '0.0.0.0');
  console.log(`La aplicación esta corriendo en el puerto: ${port}`);
}
bootstrap();
