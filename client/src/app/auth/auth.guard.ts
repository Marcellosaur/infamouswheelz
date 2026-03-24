import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot, UrlTree } from '@angular/router';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  constructor(private auth: AuthService, private router: Router) {}

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean | UrlTree {
    if (!this.auth.isAuthenticated()) {
      // Redirect unauthenticated users to login
      return this.router.createUrlTree(['/login']);
    }

    const allowedRoles = route.data['roles'] as Array<'buyer' | 'seller' | 'admin'> | undefined;
    if (!allowedRoles || allowedRoles.length === 0) {
      return true;
    }

    const role = this.auth.getUserRole();
    if (role && allowedRoles.includes(role)) {
      return true;
    }

    // Role mismatch: send to their own dashboard
    const target = role === 'admin' 
      ? '/admin-dashboard' 
      : role === 'seller' 
      ? '/seller-dashboard' 
      : '/buyer-dashboard';
    return this.router.createUrlTree([target]);
  }
}
