import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private baseUrl = `${environment.supabaseUrl}/rest/v1`;
  private authUrl = `${environment.supabaseUrl}/auth/v1`;

  constructor(private http: HttpClient) { }

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('supabase_token');
    return new HttpHeaders({
      'apikey': environment.supabaseKey,
      'Authorization': token ? `Bearer ${token}` : `Bearer ${environment.supabaseKey}`,
      'Content-Type': 'application/json'
    });
  }

  getAll(table: string): Observable<any> {
    return this.http.get(`${this.baseUrl}/${table}`, { headers: this.getHeaders() });
  }

  getById(table: string, id: number): Observable<any> {
    return this.http.get(`${this.baseUrl}/${table}?id=eq.${id}`, { headers: this.getHeaders() });
  }

  create(table: string, body: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/${table}`, body, { headers: this.getHeaders() });
  }

  update(table: string, id: number, body: any): Observable<any> {
    return this.http.patch(`${this.baseUrl}/${table}?id=eq.${id}`, body, { headers: this.getHeaders() });
  }

  delete(table: string, id: number): Observable<any> {
    return this.http.delete(`${this.baseUrl}/${table}?id=eq.${id}`, { headers: this.getHeaders() });
  }

  signUp(email: string, password: string): Observable<any> {
    return this.http.post(
      `${this.authUrl}/signup`,
      { email, password },
      { headers: this.getHeaders() }
    );
  }

  queryAggregate(
    table: string,
    type: 'count' | 'sum',
    field?: string,
    filters?: { [key: string]: any }
  ): Observable<any> {
    let url = `${this.baseUrl}/${table}`;

    if (filters) {
      const filterStrings = Object.entries(filters).map(([key, value]) => {
        if (value === null) return `${key}=is.null`;
        if (typeof value === 'boolean') return `${key}=eq.${value}`;
        return `${key}=eq.${value}`;
      });
      if (filterStrings.length) url += `?${filterStrings.join('&')}`;
    }

    let headers = this.getHeaders();
    if (type === 'count') {
      headers = headers.set('Prefer', 'count=exact');
    }

    if (type === 'sum' && field) {
      url = `${this.baseUrl}/rpc/${table}_sum?field=${field}`;
    }

    return this.http.get(url, { headers });
  }




  signIn(email: string, password: string): Observable<any> {
    return this.http.post(
      `${this.authUrl}/token?grant_type=password`,
      { email, password },
      { headers: this.getHeaders() }
    ).pipe(
      tap((res: any) => {
        if (res?.access_token) {
          localStorage.setItem('supabase_token', res.access_token);
        }
      })
    );
  }

  signOut(): void {
    localStorage.removeItem('supabase_token');
  }
}
