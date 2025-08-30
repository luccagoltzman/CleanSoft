import { ApplicationConfig, importProvidersFrom, isDevMode } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideHttpClient, withFetch } from '@angular/common/http';
import { routes } from './app.routes';
import { ToastrModule } from 'ngx-toastr';
import { provideServiceWorker } from '@angular/service-worker';
import { PipesModule } from './pipes/mask.module';
import { provideNgxMask } from 'ngx-mask';

export const appConfig: ApplicationConfig = {
    providers: [
        provideRouter(routes),
        provideAnimations(),
        provideHttpClient(withFetch()),
        importProvidersFrom(
            ToastrModule.forRoot({
                timeOut: 5000,
                closeButton: true,
                progressBar: true,
                preventDuplicates: true,
                positionClass: 'toast-top-right',
                tapToDismiss: true
            }),
            PipesModule
        ),
        provideNgxMask(), // <-- máscara agora é fornecida assim
        provideServiceWorker('ngsw-worker.js', {
            enabled: !isDevMode(),
            registrationStrategy: 'registerWhenStable:30000'
        })
    ]
};
