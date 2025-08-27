import { ApplicationConfig, importProvidersFrom } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideHttpClient, withFetch } from '@angular/common/http';

import { routes } from './app.routes';
import { ToastrModule } from 'ngx-toastr';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideAnimations(),
    provideHttpClient(
      withFetch()
    ),
    importProvidersFrom(
      ToastrModule.forRoot({
        timeOut: 5000,           // duração em ms (5s)
        closeButton: true,       // mostra botão de fechar
        progressBar: true,       // barra de progresso opcional
        preventDuplicates: true,
        positionClass: 'toast-top-right',
        tapToDismiss: true       // permite fechar ao clicar
      })
    )
  ]
};
