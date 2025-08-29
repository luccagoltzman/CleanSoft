import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, of, throwError, forkJoin } from 'rxjs';
import { catchError, map, timeout, retry, switchMap } from 'rxjs/operators';

export interface VehicleBrand {
  id: string;
  name: string;
  code?: string;
}

export interface VehicleModel {
  id: string;
  name: string;
  code?: string;
  years?: number[];
}

export interface VehicleYear {
  year: number;
  fipeCode?: string;
}

export interface FipeVehicleData {
  brand: string;
  model: string;
  year: number;
  fipeCode?: string;
  value?: string;
  fuel?: string;
}

@Injectable({
  providedIn: 'root'
})
export class VehicleApiService {
  private readonly FIPE_BASE_URL = 'https://parallelum.com.br/fipe/api/v1';
  private readonly FIPE_ONLINE_URL = 'https://fipe.online/api/v1';
  private readonly AUTODATA_URL = 'https://api.autodata.com.br/v1';
  
  // Timeout para requisições (5 segundos)
  private readonly TIMEOUT_MS = 5000;

  constructor(private http: HttpClient) {}

  /**
   * Busca todas as marcas de veículos da API FIPE
   */
  getBrands(): Observable<VehicleBrand[]> {
    return this.getFipeBrands().pipe(
      catchError(error => {
        console.error('Erro ao buscar marcas da FIPE:', error);
        return throwError('Não foi possível carregar as marcas de veículos. Verifique sua conexão com a internet.');
      })
    );
  }

  /**
   * Busca modelos por marca da API FIPE
   */
  getModelsByBrand(brandCode: string): Observable<VehicleModel[]> {
    return this.getFipeModelsByBrand(brandCode).pipe(
      catchError(error => {
        console.error('Erro ao buscar modelos da FIPE:', error);
        return throwError('Não foi possível carregar os modelos. Verifique sua conexão com a internet.');
      })
    );
  }

  /**
   * Busca anos disponíveis para um modelo específico da API FIPE
   */
  getYearsByModel(brandCode: string, modelCode: string): Observable<VehicleYear[]> {
    return this.getFipeYearsByModel(brandCode, modelCode).pipe(
      catchError(error => {
        console.error('Erro ao buscar anos da FIPE:', error);
        return throwError('Não foi possível carregar os anos disponíveis. Verifique sua conexão com a internet.');
      })
    );
  }

  /**
   * Busca informações completas de um veículo pela placa (quando disponível)
   */
  getVehicleByPlate(plate: string): Observable<any> {
    // Esta funcionalidade requer APIs pagas, mas deixo preparado para futuras implementações
    console.log('Busca por placa ainda não implementada:', plate);
    return of(null);
  }

  /**
   * Busca dados detalhados de um veículo específico
   */
  getVehicleDetails(brandCode: string, modelCode: string, yearCode: string): Observable<FipeVehicleData | null> {
    return this.getFipeVehicleDetails(brandCode, modelCode, yearCode).pipe(
      catchError(error => {
        console.warn('Erro ao buscar detalhes do veículo', error);
        return of(null);
      })
    );
  }



  // ===== MÉTODOS PRIVADOS - API FIPE =====

  private getFipeBrands(): Observable<VehicleBrand[]> {
    return this.http.get<any[]>(`${this.FIPE_BASE_URL}/carros/marcas`).pipe(
      timeout(this.TIMEOUT_MS),
      retry(2),
      map(brands => brands.map(brand => ({
        id: brand.codigo,
        name: brand.nome,
        code: brand.codigo
      }))),
      catchError(this.handleError)
    );
  }

  private getFipeModelsByBrand(brandCode: string): Observable<VehicleModel[]> {
    return this.http.get<any>(`${this.FIPE_BASE_URL}/carros/marcas/${brandCode}/modelos`).pipe(
      timeout(this.TIMEOUT_MS),
      retry(2),
      map(response => response.modelos.map((model: any) => ({
        id: model.codigo,
        name: model.nome,
        code: model.codigo
      }))),
      catchError(this.handleError)
    );
  }

  private getFipeYearsByModel(brandCode: string, modelCode: string): Observable<VehicleYear[]> {
    return this.http.get<any[]>(`${this.FIPE_BASE_URL}/carros/marcas/${brandCode}/modelos/${modelCode}/anos`).pipe(
      timeout(this.TIMEOUT_MS),
      retry(2),
      map(years => years.map(year => ({
        year: parseInt(year.nome.split(' ')[0]),
        fipeCode: year.codigo
      }))),
      catchError(this.handleError)
    );
  }

  private getFipeVehicleDetails(brandCode: string, modelCode: string, yearCode: string): Observable<FipeVehicleData> {
    return this.http.get<any>(`${this.FIPE_BASE_URL}/carros/marcas/${brandCode}/modelos/${modelCode}/anos/${yearCode}`).pipe(
      timeout(this.TIMEOUT_MS),
      retry(2),
      map(data => ({
        brand: data.Marca,
        model: data.Modelo,
        year: parseInt(data.AnoModelo),
        fipeCode: data.CodigoFipe,
        value: data.Valor,
        fuel: data.Combustivel
      })),
      catchError(this.handleError)
    );
  }

  // ===== TRATAMENTO DE ERROS =====

  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'Erro desconhecido';
    
    if (error.error instanceof ErrorEvent) {
      // Erro do lado cliente
      errorMessage = `Erro: ${error.error.message}`;
    } else {
      // Erro do lado servidor
      errorMessage = `Código: ${error.status}, Mensagem: ${error.message}`;
    }
    
    console.error('Erro na API de veículos:', errorMessage);
    return throwError(errorMessage);
  }

  // ===== MÉTODOS UTILITÁRIOS =====

  /**
   * Valida se uma marca existe na lista
   */
  validateBrand(brandName: string): Observable<boolean> {
    return this.getBrands().pipe(
      map(brands => brands.some(brand => 
        brand.name.toLowerCase() === brandName.toLowerCase()
      ))
    );
  }

  /**
   * Busca uma marca pelo nome
   */
  findBrandByName(brandName: string): Observable<VehicleBrand | null> {
    return this.getBrands().pipe(
      map(brands => brands.find(brand => 
        brand.name.toLowerCase() === brandName.toLowerCase()
      ) || null)
    );
  }

  /**
   * Busca um modelo pelo nome dentro de uma marca
   */
  findModelByName(brandCode: string, modelName: string): Observable<VehicleModel | null> {
    return this.getModelsByBrand(brandCode).pipe(
      map(models => models.find(model => 
        model.name.toLowerCase() === modelName.toLowerCase()
      ) || null)
    );
  }
}
