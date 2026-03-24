import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { Router } from '@angular/router';
import { environment } from 'src/environments/environment';

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
  role?: 'buyer' | 'seller' | 'admin';
}

export interface LoginPayload {
  email: string;
  password: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private tokenKey = 'auth_token';
  private api = environment.apiUrl;

  constructor(private http: HttpClient, private router: Router) {}

  register(payload: RegisterPayload): Observable<{ token: string }> {
    return this.http
      .post<{ token: string }>(`${this.api}/register`, payload)
      .pipe(tap(res => this.setToken(res.token))); // Creates account and stores JWT.
  }

  login(payload: LoginPayload): Observable<{ token: string }> {
    return this.http.post<{ token: string }>(`${this.api}/login`, payload)
      .pipe(tap(res => this.setToken(res.token))); // Sends the user's credentials to your server to log in.
  }

  // Decode token payload to read role/claims for routing.
  private decodeTokenPayload(token: string): { role?: 'buyer' | 'seller' | 'admin' } | null {
    const parts = token.split('.');
    if (parts.length < 2) return null;
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, '=');
    try {
      return JSON.parse(atob(padded));
    } catch {
      return null;
    }
  }

  setToken(token: string) {
    localStorage.setItem(this.tokenKey, token); // Stores the JWT token in the browser's local storage.
  }

  getToken(): string | null {
    return localStorage.getItem(this.tokenKey); // Retrieves the JWT token from the browser's local storage.
  }

  logout() {
    localStorage.removeItem(this.tokenKey); // Removes the JWT token from the browser's local storage.
    this.router.navigate(['/login']);
  }

  isAuthenticated(): boolean {
    return !!this.getToken(); // Checks if a token exists in the browser's local storage.
  }

  getUserRole(): 'buyer' | 'seller' | 'admin' | null {
    const token = this.getToken();
    if (!token) return null;
    const payload = this.decodeTokenPayload(token);
    return payload?.role ?? null;
  }

  getMe() {
    return this.http.get<{ id: number; name: string; email: string; role: string }>(`${this.api}/me`);
  }
  
}