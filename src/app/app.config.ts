import { ApplicationConfig, importProvidersFrom } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideHttpClient, withInterceptors, withFetch } from '@angular/common/http';

import { routes } from './app.routes';
import { ToastrModule } from 'ngx-toastr';
import { LoadingInterceptor } from './interceptors/loading.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideAnimations(),
    provideHttpClient(
      withInterceptors([LoadingInterceptor]),
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
