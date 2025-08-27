import { HttpInterceptorFn, HttpRequest, HttpHandlerFn, HttpEvent, HttpResponse, HttpErrorResponse } from '@angular/common/http';
import { Observable, timer } from 'rxjs';
import { tap, finalize, switchMap } from 'rxjs/operators';
import { inject } from '@angular/core';
import { LoadingService } from '../services/loading.service';

export const LoadingInterceptor: HttpInterceptorFn = (
  request: HttpRequest<unknown>,
  next: HttpHandlerFn
): Observable<HttpEvent<unknown>> => {
  const loadingService = inject(LoadingService);
  
  // Mostrar loading apenas para requisições que não são de navegação
  if (!request.url.includes('navigation') && !request.url.includes('route')) {
    loadingService.show();
  }

  return next(request).pipe(
    tap({
      next: (event) => {
        if (event instanceof HttpResponse) {
          // Requisição bem-sucedida
        }
      },
      error: (error: HttpErrorResponse) => {
        // Requisição com erro
        console.error(`[LoadingInterceptor] Erro na requisição HTTP: ${request.url}`, error);
      }
    }),
    finalize(() => {
      // Ocultar loading apenas para requisições que não são de navegação
      if (!request.url.includes('navigation') && !request.url.includes('route')) {
        // Adicionar um delay mínimo para evitar loading muito rápido
        timer(300).subscribe(() => {
          loadingService.hide();
        });
      }
    })
  );
};
