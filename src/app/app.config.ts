import { registerLocaleData } from '@angular/common';
import localeEs from '@angular/common/locales/es';
import { ApplicationConfig, LOCALE_ID, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter, withComponentInputBinding, withInMemoryScrolling } from '@angular/router';
import { routes } from './app.routes';

// Números y fechas en español: 1.250 · martes, 11 de noviembre
registerLocaleData(localeEs);

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(
      routes,
      // Los parámetros de la ruta (:id) llegan como input() al componente
      withComponentInputBinding(),
      // Al cambiar de página el scroll vuelve arriba; con "atrás" recupera donde estabas
      withInMemoryScrolling({ scrollPositionRestoration: 'enabled' }),
    ),
    { provide: LOCALE_ID, useValue: 'es' },
  ],
};
