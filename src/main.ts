import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as dotenv from 'dotenv';

dotenv.config();


async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  //Configurar Cors
  app.enableCors({
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });
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
  await app.listen(port, '127.0.0.1');
  console.log(`La aplicación esta corriendo en el puerto: ${port}`);
}
bootstrap();
