import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import {
  IonApp,
  IonSplitPane,
  IonMenu,
  IonContent,
  IonList,
  IonListHeader,
  IonNote,
  IonMenuToggle,
  IonItem,
  IonIcon,
  IonLabel,
  IonRouterOutlet,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonMenuButton,
  IonButton,
  IonAvatar,
  IonChip,
  IonBadge,
  IonAccordion,
  IonAccordionGroup,
  AlertController,
  ToastController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  homeOutline,
  homeSharp,
  personOutline,
  personSharp,
  cartOutline,
  cartSharp,
  settingsOutline,
  settingsSharp,
  logOutOutline,
  pizzaOutline,
  storefront,
  cardOutline,
  receiptOutline,
  listOutline,
  statsChartOutline,
  peopleOutline,
  notificationsOutline,
  helpCircleOutline,
  informationCircleOutline,
  shieldCheckmarkOutline,
  businessOutline,
  analyticsOutline
} from 'ionicons/icons';
import { AuthService, UserProfile } from './services/auth.service';

interface AppPage {
  title: string;
  url: string;
  icon: string;
  badge?: string | number;
  color?: string;
}

interface MenuSection {
  title: string;
  icon: string;
  pages: AppPage[];
  color?: string;
  adminOnly?: boolean;
}

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
  imports: [
    CommonModule,
    RouterLink,
    IonApp,
    IonSplitPane,
    IonMenu,
    IonContent,
    IonList,
    IonListHeader,
    IonNote,
    IonMenuToggle,
    IonItem,
    IonIcon,
    IonLabel,
    IonRouterOutlet,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonMenuButton,
    IonButton,
    IonAvatar,
    IonChip,
    IonBadge,
    IonAccordion,
    IonAccordionGroup
  ],
  standalone: true,
})
export class AppComponent implements OnInit {
  userProfile: UserProfile | null = null;
  
  // Secciones del menú organizadas
  menuSections: MenuSection[] = [
    {
      title: 'Principal',
      icon: 'home-outline',
      color: 'primary',
      pages: [
        { title: 'Inicio', url: '/home', icon: 'home', color: 'primary' },
        { title: 'Mi Perfil', url: '/perfil', icon: 'person' },
        { title: 'Carrito', url: '/carrito', icon: 'cart', badge: '3' },
        { title: 'Mis Pedidos', url: '/pedidos', icon: 'receipt' }
      ]
    },
    {
      title: 'Administración',
      icon: 'business-outline',
      color: 'secondary',
      adminOnly: true,
      pages: [
        { title: 'Dashboard', url: '/admin-dashboard', icon: 'analytics', color: 'secondary' },
        { title: 'Productos', url: '/admin-productos', icon: 'storefront' },
        { title: 'Pedidos', url: '/admin-pedidos', icon: 'list' },
        { title: 'Usuarios', url: '/admin-usuarios', icon: 'people' },
        { title: 'Estadísticas', url: '/admin-stats', icon: 'stats-chart' }
      ]
    },
    {
      title: 'Soporte',
      icon: 'help-circle-outline', 
      color: 'tertiary',
      pages: [
        { title: 'Centro de Ayuda', url: '/help', icon: 'help-circle' },
        { title: 'Contacto', url: '/contact', icon: 'mail' },
        { title: 'Acerca de', url: '/about', icon: 'information-circle' }
      ]
    }
  ];

  constructor(
    private authService: AuthService,
    private router: Router,
    private alertController: AlertController,
    private toastController: ToastController
  ) {
    addIcons({
      homeOutline,
      homeSharp,
      personOutline,
      personSharp,
      cartOutline,
      cartSharp,
      settingsOutline,
      settingsSharp,
      logOutOutline,
      pizzaOutline,
      storefront,
      cardOutline,
      receiptOutline,
      listOutline,
      statsChartOutline,
      peopleOutline,
      notificationsOutline,
      helpCircleOutline,
      informationCircleOutline,
      shieldCheckmarkOutline,
      businessOutline,
      analyticsOutline
    });
  }

  ngOnInit() {
    console.log('🚀 AppComponent: Inicializando...');
    
    // Suscribirse a cambios en el perfil del usuario - SIN redirecciones automáticas
    this.authService.userProfile$.subscribe(profile => {
      console.log('👤 Perfil actualizado:', profile ? profile.displayName : 'Sin usuario');
      this.userProfile = profile;
    });

    // NO verificar autenticación aquí - dejar que los guards manejen la navegación
    console.log('🚀 AppComponent: Inicialización completada');
  }

  // Cerrar sesión con confirmación
  async logout() {
    const alert = await this.alertController.create({
      header: '👋 Cerrar Sesión',
      message: '¿Estás seguro de que deseas cerrar sesión?',
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Cerrar Sesión',
          handler: async () => {
            try {
              await this.authService.logout();
              this.presentToast('Sesión cerrada exitosamente', 'success');
              this.router.navigate(['/login']);
            } catch (error) {
              console.error('Error al cerrar sesión:', error);
              this.presentToast('Error cerrando sesión', 'danger');
            }
          }
        }
      ]
    });

    await alert.present();
  }

  // Obtener información del usuario
  getUserDisplayName(): string {
    return this.userProfile?.displayName || this.userProfile?.email || 'Usuario';
  }

  getUserInitials(): string {
    if (!this.userProfile) return 'U';
    
    if (this.userProfile.firstName && this.userProfile.lastName) {
      return `${this.userProfile.firstName[0]}${this.userProfile.lastName[0]}`.toUpperCase();
    }
    
    if (this.userProfile.displayName) {
      const names = this.userProfile.displayName.split(' ');
      return names.length > 1 
        ? `${names[0][0]}${names[1][0]}`.toUpperCase()
        : names[0][0].toUpperCase();
    }
    
    if (this.userProfile.email) {
      return this.userProfile.email[0].toUpperCase();
    }
    
    return 'U';
  }

  getUserRole(): string {
    if (!this.userProfile?.role) return 'Usuario';
    
    const roleNames: { [key: string]: string } = {
      'admin': 'Administrador',
      'user': 'Cliente'
    };
    
    return roleNames[this.userProfile.role] || 'Usuario';
  }

  getUserRoleColor(): string {
    if (!this.userProfile?.role) return 'medium';
    
    return this.userProfile.role === 'admin' ? 'warning' : 'primary';
  }

  getUserEmail(): string {
    return this.userProfile?.email || '';
  }

  getUserStats(): string {
    if (!this.userProfile?.stats || !this.userProfile.stats.totalOrders) return '';
    
    const stats = this.userProfile.stats;
    return `${stats.totalOrders} pedidos • ${this.formatPrice(stats.totalSpent)}`;
  }

  // Verificaciones de estado
  isLoggedIn(): boolean {
    return this.authService.isLoggedIn();
  }

  isAdmin(): boolean {
    return this.authService.isAdmin();
  }

  // Filtrar secciones del menú según el rol
  getVisibleMenuSections(): MenuSection[] {
    return this.menuSections.filter(section => {
      // Si la sección es solo para admin y el usuario no es admin, ocultarla
      if (section.adminOnly && !this.isAdmin()) {
        return false;
      }
      return true;
    });
  }

  // Obtener color del icono de la sección
  getSectionIconColor(section: MenuSection): string {
    return section.color || 'primary';
  }

  // Navegación
  navigateToPage(url: string) {
    console.log('🧭 Navegando a:', url);
    this.router.navigate([url]);
  }

  // Mostrar información de la cuenta
  async showAccountInfo() {
    if (!this.userProfile) return;

    const joinDate = this.userProfile.createdAt ? 
      this.formatTimestamp(this.userProfile.createdAt) : 
      'No disponible';

    const lastLoginDate = this.userProfile.lastLogin ? 
      this.formatTimestamp(this.userProfile.lastLogin) : 
      'No disponible';

    const alert = await this.alertController.create({
      header: '👤 Información de la Cuenta',
      message: `
        <div style="text-align: left; line-height: 1.6;">
          <p><strong>Nombre:</strong> ${this.userProfile.displayName || 'No especificado'}</p>
          <p><strong>Email:</strong> ${this.userProfile.email || 'No especificado'}</p>
          <p><strong>Rol:</strong> ${this.getUserRole()}</p>
          <p><strong>Teléfono:</strong> ${this.userProfile.phone || 'No especificado'}</p>
          <hr style="margin: 1rem 0;">
          <p><strong>Miembro desde:</strong> ${joinDate}</p>
          <p><strong>Último acceso:</strong> ${lastLoginDate}</p>
          ${this.userProfile.stats ? `
            <hr style="margin: 1rem 0;">
            <p><strong>Pedidos totales:</strong> ${this.userProfile.stats.totalOrders || 0}</p>
            <p><strong>Total gastado:</strong> ${this.formatPrice(this.userProfile.stats.totalSpent || 0)}</p>
          ` : ''}
        </div>
      `,
      buttons: [
        {
          text: 'Editar Perfil',
          handler: () => {
            this.router.navigate(['/perfil']);
          }
        },
        {
          text: 'Cerrar'
        }
      ]
    });

    await alert.present();
  }

  // Utilitarios
  private formatPrice(price: number): string {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(price);
  }

  private formatTimestamp(timestamp: any): string {
    if (!timestamp) return 'No disponible';
    
    try {
      // Manejar diferentes tipos de timestamp
      let date: Date;
      
      if (timestamp.seconds) {
        // Firebase Timestamp
        date = new Date(timestamp.seconds * 1000);
      } else if (timestamp.toDate) {
        // Firebase Timestamp con método toDate
        date = timestamp.toDate();
      } else if (timestamp instanceof Date) {
        // Date object
        date = timestamp;
      } else if (typeof timestamp === 'string' || typeof timestamp === 'number') {
        // String o number timestamp
        date = new Date(timestamp);
      } else {
        return 'Formato no válido';
      }
      
      return date.toLocaleDateString('es-CO', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (error) {
      console.error('Error formateando timestamp:', error);
      return 'Error en fecha';
    }
  }

  private async presentToast(message: string, color: 'success' | 'danger' | 'warning' = 'success') {
    const toast = await this.toastController.create({
      message,
      duration: 3000,
      position: 'top',
      color,
      translucent: true
    });
    await toast.present();
  }
}