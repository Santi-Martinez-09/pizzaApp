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
  IonRefresher,
  IonRefresherContent,
  IonSpinner,
  ToastController,
  LoadingController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  addOutline,
  basketOutline,
  pizzaOutline,
  cafeOutline,
  refreshOutline,
  cloudOutline,
  sunnyOutline,
  rainyOutline,
  snowOutline,
  thunderstormOutline,
  partlySunnyOutline
} from 'ionicons/icons';
import { PizzaService, Pizza, Bebida, ItemCarrito } from '../services/pizza/pizza.service';
import { WeatherService } from '../services/weather.service';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  standalone: true,
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
    IonFabButton,
    IonRefresher,
    IonRefresherContent,
    IonSpinner
  ]
})
export class HomePage implements OnInit {
  pizzas: Pizza[] = [];
  bebidas: Bebida[] = [];
  categoriaSeleccionada: 'pizzas' | 'bebidas' = 'pizzas';
  carritoCount: number = 0;
  isLoading: boolean = false;

  // Propiedades del clima
  weatherData: any = null;
  weatherLoading: boolean = false;
  weatherError: string = '';
  ciudad: string = 'Bogotá';

  constructor(
    private pizzaService: PizzaService,
    private weatherService: WeatherService,
    private router: Router,
    private toastController: ToastController,
    private loadingController: LoadingController
  ) {
    addIcons({
      addOutline,
      basketOutline,
      pizzaOutline,
      cafeOutline,
      refreshOutline,
      cloudOutline,
      sunnyOutline,
      rainyOutline,
      snowOutline,
      thunderstormOutline,
      partlySunnyOutline
    });
  }

  async ngOnInit() {
    console.log('HomePage: Iniciando...');
    await this.loadData();
    await this.loadWeather();
    
    // Suscribirse a cambios del carrito
    this.pizzaService.carrito$.subscribe(carrito => {
      const nuevoCount = carrito.reduce((total, item) => total + item.cantidad, 0);
      console.log('HomePage: Carrito actualizado, items:', carrito.length, 'cantidad total:', nuevoCount);
      this.carritoCount = nuevoCount;
    });

    // Obtener carrito inicial
    const carritoInicial = this.pizzaService.getCarrito();
    this.carritoCount = carritoInicial.reduce((total, item) => total + item.cantidad, 0);
    console.log('HomePage: Carrito inicial, total items:', this.carritoCount);
  }

  async loadData() {
    this.isLoading = true;
    
    try {
      console.log('HomePage: Cargando pizzas y bebidas...');
      
      // Cargar en paralelo para mejor rendimiento
      const [pizzasData, bebidasData] = await Promise.all([
        this.pizzaService.getPizzas(),
        this.pizzaService.getBebidas()
      ]);
      
      this.pizzas = pizzasData.filter(pizza => pizza.disponible); // Solo pizzas disponibles
      this.bebidas = bebidasData.filter(bebida => bebida.disponible); // Solo bebidas disponibles
      
      console.log('HomePage: Pizzas cargadas:', this.pizzas.length);
      console.log('HomePage: Bebidas cargadas:', this.bebidas.length);
      
    } catch (error) {
      console.error('Error cargando datos:', error);
      this.presentToast('Error cargando productos', 'danger');
    } finally {
      this.isLoading = false;
    }
  }

  // Cargar información del clima
  async loadWeather() {
    this.weatherLoading = true;
    this.weatherError = '';
    
    try {
      console.log('HomePage: Cargando clima para:', this.ciudad);
      
      this.weatherData = await this.weatherService.obtenerClima(this.ciudad).toPromise();
      console.log('HomePage: Datos del clima obtenidos:', this.weatherData);
      
    } catch (error) {
      console.error('Error cargando clima:', error);
      this.weatherError = 'No se pudo cargar el clima';
      this.weatherData = null;
    } finally {
      this.weatherLoading = false;
    }
  }

  // Obtener icono del clima basado en el código
  getWeatherIcon(weatherMain: string): string {
    const iconMap: { [key: string]: string } = {
      'Clear': 'sunny-outline',
      'Clouds': 'cloud-outline', 
      'Rain': 'rainy-outline',
      'Drizzle': 'rainy-outline',
      'Thunderstorm': 'thunderstorm-outline',
      'Snow': 'snow-outline',
      'Mist': 'cloud-outline',
      'Fog': 'cloud-outline'
    };
    
    return iconMap[weatherMain] || 'partly-sunny-outline';
  }

  // Formatear temperatura
  formatTemperature(temp: number): string {
    return Math.round(temp) + '°C';
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

    // Crear ID único para el item del carrito
    const itemId = `pizza-${pizza.id}-${Date.now()}`;
    
    const itemCarrito: ItemCarrito = {
      id: itemId,
      tipo: 'pizza',
      item: pizza,
      cantidad: 1,
      precio: pizza.precio
    };

    console.log('HomePage: Item creado para carrito:', itemCarrito);
    
    try {
      this.pizzaService.agregarAlCarrito(itemCarrito);
      this.presentToast(`🍕 ${pizza.nombre} agregada al carrito`, 'success');
      console.log('HomePage: Pizza agregada exitosamente al carrito');
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

    // Crear ID único para el item del carrito
    const itemId = `bebida-${bebida.id}-${Date.now()}`;
    
    const itemCarrito: ItemCarrito = {
      id: itemId,
      tipo: 'bebida',
      item: bebida,
      cantidad: 1,
      precio: bebida.precio
    };

    console.log('HomePage: Item creado para carrito:', itemCarrito);
    
    try {
      this.pizzaService.agregarAlCarrito(itemCarrito);
      this.presentToast(`🥤 ${bebida.nombre} agregada al carrito`, 'success');
      console.log('HomePage: Bebida agregada exitosamente al carrito');
    } catch (error) {
      console.error('Error agregando bebida al carrito:', error);
      this.presentToast('Error agregando al carrito', 'danger');
    }
  }

  goToCarrito() {
    console.log('HomePage: Navegando al carrito con', this.carritoCount, 'items');
    this.router.navigate(['/carrito']);
  }

  onCategoriaChange(event: any) {
    this.categoriaSeleccionada = event.detail.value;
    console.log('HomePage: Categoría cambiada a:', this.categoriaSeleccionada);
  }

  async refreshData(event: any) {
    console.log('HomePage: Refrescando datos...');
    try {
      await Promise.all([this.loadData(), this.loadWeather()]);
      this.presentToast('Datos actualizados', 'success');
    } catch (error) {
      this.presentToast('Error actualizando datos', 'danger');
    } finally {
      event.target.complete();
    }
  }

  private async presentToast(message: string, color: 'success' | 'danger' | 'warning' = 'success') {
    const toast = await this.toastController.create({
      message,
      duration: 2000,
      position: 'top',
      color,
      translucent: true
    });
    await toast.present();
  }

  // Métodos auxiliares para el template
  getIngredientesText(ingredientes: string[]): string {
    if (!ingredientes || ingredientes.length === 0) return '';
    
    return ingredientes.slice(0, 3).join(', ') + 
           (ingredientes.length > 3 ? ` +${ingredientes.length - 3} más` : '');
  }


  // Verificar si hay items en el carrito
  tieneItems(): boolean {
    return this.carritoCount > 0;
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