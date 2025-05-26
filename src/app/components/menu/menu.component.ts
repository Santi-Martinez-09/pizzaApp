import { Component } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-menu',
  standalone: true,
  imports: [IonicModule, CommonModule, RouterModule],
  template: `
    <ion-menu contentId="main-content">
      <ion-header>
        <ion-toolbar color="primary">
          <ion-title>Menú</ion-title>
        </ion-toolbar>
      </ion-header>
      <ion-content>
        <ion-list>
          <ion-item routerLink="/home">🏠 Home</ion-item>
          <ion-item routerLink="/carrito">🛒 Carrito</ion-item>
          <ion-item routerLink="/perfil">👤 Perfil</ion-item>
          <ion-item routerLink="/productos">📦 Productos</ion-item>
          <ion-item routerLink="/confirmar">✅ Confirmar</ion-item>
        </ion-list>
      </ion-content>
    </ion-menu>
  `
})
export class MenuComponent {}
