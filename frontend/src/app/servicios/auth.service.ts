import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, catchError, tap, throwError } from 'rxjs';
import { jwtDecode } from 'jwt-decode';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = 'http://localhost:80/api'; 
  private tokenKey = 'auth_token';
  private authStatus = new BehaviorSubject<boolean>(this.estaAutenticado());
  private userData = new BehaviorSubject<any>(this.getDatosUsuario());
  constructor(private http: HttpClient, private router: Router) {}
  // Observable para componentes externos
  authStatus$ = this.authStatus.asObservable();
  userData$ = this.userData.asObservable();
  login(email: string, password: string): Observable<any> {
    return this.http.post<{ token: string }>(
      `${this.apiUrl}/login`, 
      { email, password },
      { headers: new HttpHeaders({ 'Content-Type': 'application/json' }) }
    ).pipe(
      tap(response => {
        if (response.token) {
          this.guardarToken(response.token);
          this.authStatus.next(true);
          this.userData.next(this.getDatosUsuario());
        }
      })
    );
  }

  guardarToken(token: string): void {
    localStorage.setItem(this.tokenKey, token);
  }

  obtenerToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  estaAutenticado(): boolean {
    const token = this.obtenerToken();
    if (!token) return false;
    
    try {
      const payload: any = jwtDecode(token);
      return payload.exp > Date.now() / 1000; // Verifica si el token no ha expirado
    } catch {
      return false;
    }
  }

  register(userData: FormData): Observable<any> {
    return this.http.post(`${this.apiUrl}/registro`, userData);
  }

  getDatosUsuario(): any {
    const token = this.obtenerToken();
    if (!token) return null;
    
    try {
      return jwtDecode(token);
    } catch (error) {
      console.error('Error decodificando token:', error);
      return null;
    }
  }
refrescarToken(): Observable<{ token: string }> {
    const token = this.obtenerToken();
    if (!token) {
        return throwError(() => new Error('No hay token almacenado'));
    }

    return this.http.get<{ token: string }>(
        `${this.apiUrl}/refrescar`,
        {
            headers: new HttpHeaders({
                'Authorization': `Bearer ${token}`
            })
        }
    ).pipe(
        tap(response => {
            if (response.token) {
                this.guardarToken(response.token);
                this.authStatus.next(true);
                this.userData.next(this.getDatosUsuario());
            }
        }),
        catchError(error => {
            console.error('Error al refrescar token:', error);
            return throwError(() => error);
        })
    );
}
  logout(): void {
    localStorage.removeItem(this.tokenKey);
      this.authStatus.next(false);
    this.userData.next(null);
    this.router.navigate(['/']);
  }
}