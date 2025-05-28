import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { IonicModule } from '@ionic/angular';
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
    IonicModule,
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
  isLoading: boolean = false;

  constructor(
    private pizzaService: PizzaService,
    private router: Router,
    private toastController: ToastController,
    private loadingController: LoadingController
  ) {
    addIcons({
      addOutline,
      basketOutline,
      pizzaOutline
    });
  }

  async ngOnInit() {
    console.log('HomePage: Iniciando...');
    await this.loadData();
    
    // Suscribirse a cambios del carrito
    this.pizzaService.carrito$.subscribe(carrito => {
      this.carritoCount = carrito.reduce((total, item) => total + item.cantidad, 0);
      console.log('HomePage: Carrito actualizado, total items:', this.carritoCount);
    });

    // Cargar carrito inicial
    const carritoInicial = this.pizzaService.getCarrito();
    this.carritoCount = carritoInicial.reduce((total, item) => total + item.cantidad, 0);
    console.log('HomePage: Carrito inicial, total items:', this.carritoCount);
  }

  async loadData() {
    const loading = await this.loadingController.create({
      message: 'Cargando productos...',
      spinner: 'crescent'
    });
    await loading.present();

    try {
      console.log('HomePage: Cargando pizzas y bebidas...');
      this.pizzas = await this.pizzaService.getPizzas();
      this.bebidas = await this.pizzaService.getBebidas();
      
      console.log('HomePage: Pizzas cargadas:', this.pizzas.length);
      console.log('HomePage: Bebidas cargadas:', this.bebidas.length);
      
      await loading.dismiss();
    } catch (error) {
      console.error('Error cargando datos:', error);
      await loading.dismiss();
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
    console.log('HomePage: Agregando pizza al carrito:', pizza.nombre);
    
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

    console.log('HomePage: Item creado para carrito:', itemCarrito);
    
    try {
      this.pizzaService.agregarAlCarrito(itemCarrito);
      this.presentToast(`${pizza.nombre} agregada al carrito`, 'success');
      console.log('HomePage: Pizza agregada exitosamente');
    } catch (error) {
      console.error('Error agregando pizza al carrito:', error);
      this.presentToast('Error agregando al carrito', 'danger');
    }
  }

  async agregarBebidaAlCarrito(bebida: Bebida) {
    console.log('HomePage: Agregando bebida al carrito:', bebida.nombre);
    
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

    console.log('HomePage: Item creado para carrito:', itemCarrito);
    
    try {
      this.pizzaService.agregarAlCarrito(itemCarrito);
      this.presentToast(`${bebida.nombre} agregada al carrito`, 'success');
      console.log('HomePage: Bebida agregada exitosamente');
    } catch (error) {
      console.error('Error agregando bebida al carrito:', error);
      this.presentToast('Error agregando al carrito', 'danger');
    }
  }

  goToCarrito() {
    console.log('HomePage: Navegando al carrito');
    this.router.navigate(['/carrito']);
  }

  onCategoriaChange(event: any) {
    this.categoriaSeleccionada = event.detail.value;
    console.log('HomePage: Categoría cambiada a:', this.categoriaSeleccionada);
  }

  async refreshData(event: any) {
    console.log('HomePage: Refrescando datos...');
    await this.loadData();
    event.target.complete();
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

  // Métodos auxiliares para el template
  getIngredientesText(ingredientes: string[]): string {
    return ingredientes.slice(0, 3).join(', ') + 
           (ingredientes.length > 3 ? `... +${ingredientes.length - 3} más` : '');
  }

  getCategoriaIcon(categoria: string): string {
    const iconos: { [key: string]: string } = {
      'clasica': '🍕',
      'especial': '⭐',
      'vegana': '🌱',
      'personalizada': '🎨'
    };
    return iconos[categoria] || '🍕';
  }

  // Track functions para optimizar ngFor
  trackByPizzaId(index: number, pizza: Pizza): string {
    return pizza.id || index.toString();
  }

  trackByBebidaId(index: number, bebida: Bebida): string {
    return bebida.id || index.toString();
  }
}