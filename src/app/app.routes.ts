import { Routes } from '@angular/router';
import { AuthGuard, AdminGuard, PublicGuard } from './services/auth.guard';

export const routes: Routes = [
  // ============ RUTAS PÚBLICAS (Solo no autenticados) ============
  {
    path: 'login',
    loadComponent: () => import('./login/login.page').then(m => m.LoginPage),
    canActivate: [PublicGuard]
  },
  {
    path: 'register',
    loadComponent: () => import('./register/register.page').then(m => m.RegisterPage),
    canActivate: [PublicGuard]
  },

  // ============ RUTAS PROTEGIDAS (Usuarios autenticados) ============
  {
    path: 'home',
    loadComponent: () => import('./home/home.page').then(m => m.HomePage),
    canActivate: [AuthGuard]
  },
  {
    path: 'perfil',
    loadComponent: () => import('./perfil/perfil.page').then(m => m.PerfilPage),
    canActivate: [AuthGuard]
  },
  {
    path: 'carrito',
    loadComponent: () => import('./carrito/carrito.page').then(m => m.CarritoPage),
    canActivate: [AuthGuard]
  },
  {
    path: 'pedidos',
    loadComponent: () => import('./pedidos/pedidos.page').then(m => m.PedidosPage),
    canActivate: [AuthGuard]
  },
  {
    path: 'pago',
    loadComponent: () => import('./pago/pago.page').then(m => m.PagoPage),
    canActivate: [AuthGuard]
  },
  {
    path: 'pagos',
    loadComponent: () => import('./pagos/pagos.page').then(m => m.PagosPage),
    canActivate: [AuthGuard]
  },

  // ============ RUTAS DE ADMINISTRADOR ============
  {
    path: 'admin-productos',
    loadComponent: () => import('./admin-productos/admin-productos.page').then(m => m.AdminProductosPage),
    canActivate: [AdminGuard],
    data: { roles: ['admin'] }
  },
  // Rutas adicionales de admin (temporalmente redirigen a admin-productos hasta que se implementen)
  {
    path: 'admin-pedidos',
    redirectTo: '/admin-productos',
    pathMatch: 'full'
  },
  {
    path: 'admin-usuarios',
    redirectTo: '/admin-productos',
    pathMatch: 'full'
  },
  {
    path: 'admin-dashboard',
    redirectTo: '/admin-productos',
    pathMatch: 'full'
  },
  {
    path: 'admin-stats',
    redirectTo: '/admin-productos',
    pathMatch: 'full'
  },

  // ============ RUTAS DE CONFIGURACIÓN ============
  // Rutas temporalmente redirigen a perfil hasta que se implementen
  {
    path: 'configuracion',
    redirectTo: '/perfil',
    pathMatch: 'full'
  },
  {
    path: 'notificaciones',
    redirectTo: '/perfil',
    pathMatch: 'full'
  },

  // ============ RUTAS DE SOPORTE ============
  // Rutas temporalmente redirigen a home hasta que se implementen
  {
    path: 'help',
    redirectTo: '/home',
    pathMatch: 'full'
  },
  {
    path: 'contact',
    redirectTo: '/home',
    pathMatch: 'full'
  },
  {
    path: 'about',
    redirectTo: '/home',
    pathMatch: 'full'
  },

  // ============ RUTAS ESPECIALES ============
  {
    path: 'account-disabled',
    redirectTo: '/login',
    pathMatch: 'full'
  },

  // ============ REDIRECCIONES ============
  {
    path: '',
    redirectTo: '/login',
    pathMatch: 'full',
  },
  
  // Redirigir rutas no válidas al login
  {
    path: '**',
    redirectTo: '/login',
  }
];

// ============ CONFIGURACIÓN DE NAVEGACIÓN ============

export interface NavigationConfig {
  userPages: AppPage[];
  adminPages: AppPage[];
  supportPages: AppPage[];
}

export interface AppPage {
  title: string;
  url: string;
  icon: string;
  badge?: string | number;
  color?: string;
  description?: string;
}

export const navigationConfig: NavigationConfig = {
  userPages: [
    {
      title: 'Inicio',
      url: '/home',
      icon: 'home',
      color: 'primary',
      description: 'Explorar menú y hacer pedidos'
    },
    {
      title: 'Mi Perfil',
      url: '/perfil',
      icon: 'person',
      description: 'Gestionar información personal'
    },
    {
      title: 'Carrito',
      url: '/carrito',
      icon: 'cart',
      description: 'Revisar y completar pedido'
    },
    {
      title: 'Mis Pedidos',
      url: '/pedidos',
      icon: 'receipt',
      description: 'Historial y estado de pedidos'
    }
  ],
  
  adminPages: [
    {
      title: 'Dashboard',
      url: '/admin-dashboard',
      icon: 'analytics',
      color: 'secondary',
      description: 'Panel de control principal'
    },
    {
      title: 'Productos',
      url: '/admin-productos',
      icon: 'storefront',
      description: 'Gestionar menú y precios'
    },
    {
      title: 'Pedidos',
      url: '/admin-pedidos',
      icon: 'list',
      description: 'Administrar pedidos de clientes'
    },
    {
      title: 'Usuarios',
      url: '/admin-usuarios',
      icon: 'people',
      description: 'Gestionar cuentas de usuarios'
    },
    {
      title: 'Estadísticas',
      url: '/admin-stats',
      icon: 'stats-chart',
      description: 'Reportes y métricas'
    }
  ],
  
  supportPages: [
    {
      title: 'Centro de Ayuda',
      url: '/help',
      icon: 'help-circle',
      description: 'Preguntas frecuentes y guías'
    },
    {
      title: 'Contacto',
      url: '/contact',
      icon: 'mail',
      description: 'Enviar mensaje al soporte'
    },
    {
      title: 'Acerca de',
      url: '/about',
      icon: 'information-circle',
      description: 'Información de la aplicación'
    }
  ]
};

// ============ UTILIDADES DE NAVEGACIÓN ============

export class NavigationHelper {
  
  /**
   * Obtiene la ruta de inicio según el rol del usuario
   */
  static getHomeRouteByRole(role: 'admin' | 'user'): string {
    return role === 'admin' ? '/admin-dashboard' : '/home';
  }
  
  /**
   * Verifica si una ruta requiere permisos de administrador
   */
  static isAdminRoute(url: string): boolean {
    return url.startsWith('/admin-');
  }
  
  /**
   * Verifica si una ruta es pública (no requiere autenticación)
   */
  static isPublicRoute(url: string): boolean {
    const publicRoutes = ['/login', '/register', '/account-disabled'];
    return publicRoutes.includes(url);
  }
  
  /**
   * Obtiene las páginas permitidas según el rol del usuario
   */
  static getAllowedPages(role: 'admin' | 'user'): AppPage[] {
    const userPages = navigationConfig.userPages;
    const adminPages = role === 'admin' ? navigationConfig.adminPages : [];
    const supportPages = navigationConfig.supportPages;
    
    return [...userPages, ...adminPages, ...supportPages];
  }
  
  /**
   * Obtiene la información de una página por su URL
   */
  static getPageInfo(url: string): AppPage | null {
    const allPages = [
      ...navigationConfig.userPages,
      ...navigationConfig.adminPages,
      ...navigationConfig.supportPages
    ];
    
    return allPages.find(page => page.url === url) || null;
  }
}