import { INestApplication, ValidationPipe } from '@nestjs/common';

/** Konfigurasi bersama untuk main.ts dan test e2e. */
export function configureApp(app: INestApplication): void {
  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, transform: true }),
  );
}
