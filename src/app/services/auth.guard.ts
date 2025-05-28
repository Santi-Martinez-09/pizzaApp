import { Injectable } from '@angular/core';
import { CanActivate, CanActivateChild, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { Observable, of } from 'rxjs';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate, CanActivateChild {
  
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> | Promise<boolean> | boolean {
    return this.checkAuth(route, state);
  }

  canActivateChild(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> | Promise<boolean> | boolean {
    return this.checkAuth(route, state);
  }

  private checkAuth(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean> {
    console.log('🛡️ AuthGuard: Verificando acceso a:', state.url);
    
    // Verificación simple y directa
    const isLoggedIn = this.authService.isLoggedIn();
    const userProfile = this.authService.getUserProfile();
    
    if (!isLoggedIn || !userProfile) {
      console.log('🛡️ AuthGuard: Usuario no autenticado, redirigiendo al login');
      this.router.navigate(['/login']);
      return of(false);
    }

    // Verificar si la cuenta está activa
    if (userProfile.isActive === false) {
      console.log('🛡️ AuthGuard: Cuenta desactivada');
      this.authService.logout();
      this.router.navigate(['/login']);
      return of(false);
    }

    // Verificar roles específicos si están definidos en la ruta
    const requiredRoles = route.data?.['roles'] as string[];
    if (requiredRoles && requiredRoles.length > 0) {
      const hasRequiredRole = requiredRoles.includes(userProfile.role);
      
      if (!hasRequiredRole) {
        console.log('🛡️ AuthGuard: Usuario sin permisos suficientes');
        console.log('🛡️ Rol requerido:', requiredRoles);
        console.log('🛡️ Rol del usuario:', userProfile.role);
        
        // Redirigir según el rol del usuario sin crear bucles
        if (userProfile.role === 'admin' && state.url !== '/admin-productos') {
          this.router.navigate(['/admin-productos']);
        } else if (userProfile.role === 'user' && state.url !== '/home') {
          this.router.navigate(['/home']);
        }
        
        return of(false);
      }
    }

    console.log('✅ AuthGuard: Acceso concedido para:', userProfile.displayName);
    return of(true);
  }
}

// Guard específico para administradores
@Injectable({
  providedIn: 'root'
})
export class AdminGuard implements CanActivate {
  
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> {
    console.log('👑 AdminGuard: Verificando permisos de admin para:', state.url);
    
    const isLoggedIn = this.authService.isLoggedIn();
    const userProfile = this.authService.getUserProfile();
    
    if (!isLoggedIn || !userProfile) {
      console.log('👑 AdminGuard: Usuario no autenticado');
      this.router.navigate(['/login']);
      return of(false);
    }

    if (userProfile.role !== 'admin') {
      console.log('👑 AdminGuard: Acceso denegado - no es admin');
      this.router.navigate(['/home']);
      return of(false);
    }

    console.log('✅ AdminGuard: Acceso de admin concedido');
    return of(true);
  }
}

// Guard para rutas públicas (solo no autenticados)
@Injectable({
  providedIn: 'root'
})
export class PublicGuard implements CanActivate {
  
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
    const isLoggedIn = this.authService.isLoggedIn();
    const currentUrl = state.url;
    
    console.log('🔓 PublicGuard: Verificando ruta pública:', currentUrl, 'Usuario logueado:', isLoggedIn);
    
    if (isLoggedIn) {
      const profile = this.authService.getUserProfile();
      
      // Evitar redirecciones infinitas - solo redirigir si no estamos ya en la ruta correcta
      if (profile?.role === 'admin' && currentUrl !== '/admin-productos') {
        console.log('🔓 PublicGuard: Admin detectado, redirigiendo a admin-productos');
        this.router.navigate(['/admin-productos']);
        return false;
      } else if (profile?.role === 'user' && currentUrl !== '/home') {
        console.log('🔓 PublicGuard: Usuario detectado, redirigiendo a home');
        this.router.navigate(['/home']);
        return false;
      }
      
      // Si ya estamos en la ruta correcta, permitir acceso para evitar bucles
      return false;
    }

    console.log('✅ PublicGuard: Acceso a ruta pública concedido');
    return true;
  }
}