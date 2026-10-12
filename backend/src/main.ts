import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const logger = new Logger('ClimaLedgerBootstrap');
  const app = await NestFactory.create(AppModule);

  // Enable CORS untuk Frontend Next.js (port 3000 dll)
  app.enableCors({
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  // Global prefix api/v1 untuk route bisnis, kecuali endpoint testnet
  app.setGlobalPrefix('api/v1', {
    exclude: ['testnet', 'testnet/(.*)'],
  });

  const port = process.env.PORT || 3001;
  await app.listen(port);

  logger.log(`=======================================================`);
  logger.log(`🌿 ClimaLedger Backend is running on: http://localhost:${port}`);
  logger.log(`📡 REST API Base: http://localhost:${port}/api/v1`);
  logger.log(`⚡ WebSocket Tokenize: ws://localhost:${port}/ws/tokenize`);
  logger.log(`⚡ WebSocket Testnet:  ws://localhost:${port}/ws/testnet`);
  logger.log(`⛓️  Testnet Endpoints: http://localhost:${port}/testnet/status`);
  logger.log(`=======================================================`);
}

bootstrap();

