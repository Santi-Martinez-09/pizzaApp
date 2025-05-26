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
  IonButton
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
  cardOutline
} from 'ionicons/icons';
import { AuthService } from './services/auth.service';

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
    IonButton
  ],
  standalone: true,
})
export class AppComponent implements OnInit {
  public appPages = [
    { title: 'Inicio', url: '/home', icon: 'home' },
    { title: 'Mi Perfil', url: '/perfil', icon: 'person' },
    { title: 'Carrito', url: '/carrito', icon: 'cart' },
    { title: 'Mis Pedidos', url: '/pedidos', icon: 'receipt' },
  ];

  public adminPages = [
    { title: 'Administrar Productos', url: '/admin-productos', icon: 'storefront' },
    { title: 'Pedidos', url: '/admin-pedidos', icon: 'list' },
  ];

  constructor(
    public authService: AuthService,
    private router: Router
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
      cardOutline
    });
  }

  ngOnInit() {
    // Verificar autenticación
    if (!this.authService.isLoggedIn()) {
      this.router.navigate(['/login']);
    }
  }

  async logout() {
    try {
      await this.authService.logout();
      this.router.navigate(['/login']);
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  }

  getUserDisplayName(): string {
    const profile = this.authService.getUserProfile();
    return profile?.displayName || profile?.email || 'Usuario';
  }

  isLoggedIn(): boolean {
    return this.authService.isLoggedIn();
  }

  isAdmin(): boolean {
    return this.authService.isAdmin();
  }
}