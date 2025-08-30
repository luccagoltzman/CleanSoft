import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private http = inject(HttpClient);
  private authUrl = `${environment.supabaseUrl}/auth/v1`;

  private getHeaders(): HttpHeaders {
    return new HttpHeaders({
      'apikey': environment.supabaseKey,
      'Authorization': environment.UserToken
        ? `Bearer ${environment.UserToken}`
        : `Bearer ${environment.supabaseKey}`,
      'Content-Type': 'application/json'
    });
  }

  signUp(email: string, password: string): Observable<any> {
    return this.http.post(
      `${this.authUrl}/signup`,
      { email, password },
      { headers: this.getHeaders() }
    );
  }

  login(email: string, password: string): Observable<any> {
    return this.http.post(
      `${this.authUrl}/token?grant_type=password`,
      { email, password },
      { headers: this.getHeaders() }
    ).pipe(
      tap((res: any) => {
        if (res?.access_token && typeof localStorage !== 'undefined') {
          localStorage.setItem('token', res.access_token);
          localStorage.setItem('user_email', res.user.email);

        }
      })
    );
  }

  logout() {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem('token');
    }
  }

  isAuthenticated(): boolean {
    // retorna true se tiver token válido no localStorage
    return !!localStorage.getItem('token');
  }

  getToken(): string | null {
    if (typeof localStorage === 'undefined') return null;
    return localStorage.getItem('token');
  }
}
