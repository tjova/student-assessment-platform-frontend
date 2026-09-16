import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, Router } from '@angular/router';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class RoleGuard implements CanActivate {

  constructor(private authService: AuthService, private router: Router) {}

  canActivate(route: ActivatedRouteSnapshot): boolean {
    const allowedRoles: string[] = route.data['allowedRoles'] ?? [];

    if (allowedRoles.length === 0) {
      return true;
    }

    if (allowedRoles.some(role => this.authService.hasRole(role))) {
      return true;
    }

    console.warn(`User role '${this.authService.getRoles()}' not in allowed roles: ${allowedRoles}`);
    this.router.navigate(['/']);
    return false;
  }
}
