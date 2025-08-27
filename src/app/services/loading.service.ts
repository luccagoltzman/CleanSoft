import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class LoadingService {
  private loadingSubject = new BehaviorSubject<boolean>(false);
  public loading$: Observable<boolean> = this.loadingSubject.asObservable();

  constructor() { }

  /**
   * Mostra o spinner de carregamento
   */
  show(): void {
    this.loadingSubject.next(true);
  }

  /**
   * Esconde o spinner de carregamento
   */
  hide(): void {
    this.loadingSubject.next(false);
  }

  /**
   * Esconde o spinner forçadamente (útil para casos de erro)
   */
  forceHide(): void {
    this.loadingSubject.next(false);
  }

  /**
   * Reseta o estado do loading (útil para inicialização)
   */
  reset(): void {
    this.loadingSubject.next(false);
  }

  /**
   * Verifica se está carregando
   */
  get isLoading(): boolean {
    return this.loadingSubject.value;
  }
}
