import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
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
  ToastController,
  LoadingController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  addOutline,
  basketOutline,
  pizzaOutline,
  cartOutline
} from 'ionicons/icons';
import { PizzaService, Pizza, Bebida, ItemCarrito } from '../services/pizza/pizza.service';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  standalone: true,
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
export class HomePage implements OnInit, OnDestroy {
  pizzas: Pizza[] = [];
  bebidas: Bebida[] = [];
  categoriaSeleccionada: 'pizzas' | 'bebidas' = 'pizzas';
  carritoCount: number = 0;
  isLoading: boolean = false;
  private carritoSubscription?: Subscription;

  constructor(
    private pizzaService: PizzaService,
    private router: Router,
    private toastController: ToastController,
    private loadingController: LoadingController
  ) {
    addIcons({
      addOutline,
      basketOutline,
      pizzaOutline,
      cartOutline
    });
  }

  async ngOnInit() {
    console.log('HomePage: Iniciando componente');
    await this.loadData();
    
    // Suscribirse a cambios del carrito
    this.carritoSubscription = this.pizzaService.carrito$.subscribe(carrito => {
      this.carritoCount = carrito.reduce((total, item) => total + item.cantidad, 0);
      console.log('HomePage: Carrito actualizado, items:', this.carritoCount);
    });
  }

  ngOnDestroy() {
    if (this.carritoSubscription) {
      this.carritoSubscription.unsubscribe();
    }
  }

  async loadData() {
    this.isLoading = true;
    
    const loading = await this.loadingController.create({
      message: 'Cargando productos...',
      spinner: 'crescent',
      duration: 10000 // timeout de 10 segundos
    });
    
    await loading.present();

    try {
      console.log('HomePage: Cargando pizzas y bebidas...');
      
      // Cargar pizzas y bebidas en paralelo
      const [pizzasData, bebidasData] = await Promise.all([
        this.pizzaService.getPizzas(),
        this.pizzaService.getBebidas()
      ]);
      
      this.pizzas = pizzasData;
      this.bebidas = bebidasData;
      
      console.log('HomePage: Datos cargados', {
        pizzas: this.pizzas.length,
        bebidas: this.bebidas.length
      });
      
    } catch (error) {
      console.error('Error cargando datos:', error);
      this.presentToast('Error cargando productos', 'danger');
    } finally {
      this.isLoading = false;
      await loading.dismiss();
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

    if (!pizza.id) {
      console.error('Pizza sin ID:', pizza);
      this.presentToast('Error: Pizza sin identificador', 'danger');
      return;
    }

    const itemCarrito: ItemCarrito = {
      id: `pizza-${pizza.id}-${Date.now()}`,
      tipo: 'pizza',
      item: pizza,
      cantidad: 1,
      precio: pizza.precio
    };

    console.log('HomePage: Agregando pizza al carrito', itemCarrito);
    
    try {
      this.pizzaService.agregarAlCarrito(itemCarrito);
      this.presentToast(`${pizza.nombre} agregada al carrito`);
    } catch (error) {
      console.error('Error agregando pizza al carrito:', error);
      this.presentToast('Error agregando al carrito', 'danger');
    }
  }

  async agregarBebidaAlCarrito(bebida: Bebida) {
    if (!bebida.disponible) {
      this.presentToast('Esta bebida no está disponible', 'warning');
      return;
    }

    if (!bebida.id) {
      console.error('Bebida sin ID:', bebida);
      this.presentToast('Error: Bebida sin identificador', 'danger');
      return;
    }

    const itemCarrito: ItemCarrito = {
      id: `bebida-${bebida.id}-${Date.now()}`,
      tipo: 'bebida',
      item: bebida,
      cantidad: 1,
      precio: bebida.precio
    };

    console.log('HomePage: Agregando bebida al carrito', itemCarrito);
    
    try {
      this.pizzaService.agregarAlCarrito(itemCarrito);
      this.presentToast(`${bebida.nombre} agregada al carrito`);
    } catch (error) {
      console.error('Error agregando bebida al carrito:', error);
      this.presentToast('Error agregando al carrito', 'danger');
    }
  }

  goToCarrito() {
    console.log('HomePage: Navegando al carrito');
    this.router.navigate(['/carrito']);
  }

  // Método para refrescar datos
  async refreshData(event?: any) {
    await this.loadData();
    if (event) {
      event.target.complete();
    }
  }

  // Método para manejar errores de imagen
  onImageError(event: any) {
    console.log('Error cargando imagen, usando imagen por defecto');
    event.target.src = 'assets/images/default-product.jpg';
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

  // Método para debugging
  debugEstado() {
    console.log('Estado actual de HomePage:', {
      pizzas: this.pizzas,
      bebidas: this.bebidas,
      carritoCount: this.carritoCount,
      categoriaSeleccionada: this.categoriaSeleccionada
    });
  }
}