import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButtons,
  IonMenuButton,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonButton,
  IonIcon,
  IonBadge,
  IonGrid,
  IonRow,
  IonCol,
  IonSegment,
  IonSegmentButton,
  IonLabel,
  IonChip,
  IonFab,
  IonFabButton,
  ToastController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  addOutline,
  basketOutline,
  pizzaOutline
} from 'ionicons/icons';
import { PizzaService, Pizza, Bebida, ItemCarrito } from '../services/pizza/pizza.service';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  standalone: true,
  providers: [PizzaService],
  imports: [
    CommonModule,
    FormsModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonButtons,
    IonMenuButton,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonButton,
    IonIcon,
    IonBadge,
    IonGrid,
    IonRow,
    IonCol,
    IonSegment,
    IonSegmentButton,
    IonLabel,
    IonChip,
    IonFab,
    IonFabButton
  ]
})
export class HomePage implements OnInit {
  pizzas: Pizza[] = [];
  bebidas: Bebida[] = [];
  categoriaSeleccionada: 'pizzas' | 'bebidas' = 'pizzas';
  carritoCount: number = 0;

  constructor(
    private pizzaService: PizzaService,
    private router: Router,
    private toastController: ToastController
  ) {
    addIcons({
      addOutline,
      basketOutline,
      pizzaOutline
    });
  }

  async ngOnInit() {
    await this.loadData();
    
    // Suscribirse a cambios del carrito
    this.pizzaService.carrito$.subscribe(carrito => {
      this.carritoCount = carrito.reduce((total, item) => total + item.cantidad, 0);
    });
  }

  async loadData() {
    try {
      this.pizzas = await this.pizzaService.getPizzas();
      this.bebidas = await this.pizzaService.getBebidas();
    } catch (error) {
      console.error('Error cargando datos:', error);
      this.presentToast('Error cargando productos', 'danger');
    }
  }

  formatPrice(price: number): string {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(price);
  }

  async agregarPizzaAlCarrito(pizza: Pizza) {
    if (!pizza.disponible) {
      this.presentToast('Esta pizza no está disponible', 'warning');
      return;
    }

    const itemCarrito: ItemCarrito = {
      id: `pizza-${pizza.id}-${Date.now()}`,
      tipo: 'pizza',
      item: pizza,
      cantidad: 1,
      precio: pizza.precio
    };

    this.pizzaService.agregarAlCarrito(itemCarrito);
    this.presentToast(`${pizza.nombre} agregada al carrito`);
  }

  async agregarBebidaAlCarrito(bebida: Bebida) {
    if (!bebida.disponible) {
      this.presentToast('Esta bebida no está disponible', 'warning');
      return;
    }

    const itemCarrito: ItemCarrito = {
      id: `bebida-${bebida.id}-${Date.now()}`,
      tipo: 'bebida',
      item: bebida,
      cantidad: 1,
      precio: bebida.precio
    };

    this.pizzaService.agregarAlCarrito(itemCarrito);
    this.presentToast(`${bebida.nombre} agregada al carrito`);
  }

  goToCarrito() {
    this.router.navigate(['/carrito']);
  }

  private async presentToast(message: string, color: 'success' | 'danger' | 'warning' = 'success') {
    const toast = await this.toastController.create({
      message,
      duration: 2000,
      position: 'top',
      color
    });
    await toast.present();
  }
}