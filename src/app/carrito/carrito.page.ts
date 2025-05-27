import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { WeatherService } from '../services/weather.service';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButtons,
  IonBackButton,
  IonList,
  IonItem,
  IonLabel,
  IonButton,
  IonIcon,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonBadge,
  IonNote,
  IonItemSliding,
  IonItemOptions,
  IonItemOption,
  AlertController,
  ToastController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  removeOutline,
  addOutline,
  trashOutline,
  cartOutline,
  cardOutline,
  locationOutline, 
  receiptOutline 
} from 'ionicons/icons';
import { PizzaService, ItemCarrito } from '../services/pizza/pizza.service';

@Component({
  selector: 'app-carrito',
  templateUrl: './carrito.page.html',
  styleUrls: ['./carrito.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonButtons,
    IonBackButton,
    IonList,
    IonItem,
    IonLabel,
    IonButton,
    IonIcon,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonBadge,
    IonNote,
    IonItemSliding,
    IonItemOptions,
    IonItemOption
  ]
})

export class CarritoPage implements OnInit {
  carrito: ItemCarrito[] = [];
  subtotal: number = 0;
  domicilio: number = 5000; // Costo fijo de domicilio
  total: number = 0;
  clima: any;
  ciudad = 'Bogotá';
  
  constructor(
    private pizzaService: PizzaService,
    private router: Router,
    private alertController: AlertController,
    private toastController: ToastController,
    private weatherService: WeatherService
  ) {
    addIcons({trashOutline,cartOutline,removeOutline,addOutline,receiptOutline,locationOutline,cardOutline});
  }

  ngOnInit() {
    // Suscripción al carrito
    this.pizzaService.carrito$.subscribe(carrito => {
      this.carrito = carrito;
      this.calcularTotales();
    });

    // Obtener información del clima
    this.weatherService.obtenerClima(this.ciudad).subscribe({
      next: (data) => {
        this.clima = data;
        console.log('Clima obtenido:', this.clima);
      },
      error: (err) => {
        console.error('Error al obtener el clima:', err);
      }
    });
  }

  calcularTotales() {
    this.subtotal = this.carrito.reduce((total, item) => 
      total + (item.precio * item.cantidad), 0
    );
    this.total = this.subtotal + (this.carrito.length > 0 ? this.domicilio : 0);
  }

  formatPrice(price: number): string {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(price);
  }

  aumentarCantidad(item: ItemCarrito) {
    this.pizzaService.actualizarCantidad(item.id, item.cantidad + 1);
  }

  disminuirCantidad(item: ItemCarrito) {
    if (item.cantidad > 1) {
      this.pizzaService.actualizarCantidad(item.id, item.cantidad - 1);
    } else {
      this.removerItem(item);
    }
  }

  async removerItem(item: ItemCarrito) {
    const alert = await this.alertController.create({
      header: 'Remover item',
      message: `¿Deseas remover ${item.item.nombre} del carrito?`,
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Remover',
          handler: () => {
            this.pizzaService.removerDelCarrito(item.id);
            this.presentToast(`${item.item.nombre} removido del carrito`);
          }
        }
      ]
    });

    await alert.present();
  }

  async limpiarCarrito() {
    const alert = await this.alertController.create({
      header: 'Limpiar carrito',
      message: '¿Deseas remover todos los items del carrito?',
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Limpiar',
          handler: () => {
            this.pizzaService.limpiarCarrito();
            this.presentToast('Carrito limpiado');
          }
        }
      ]
    });

    await alert.present();
  }

  procederAlPago() {
    if (this.carrito.length === 0) {
      this.presentToast('El carrito está vacío', 'warning');
      return;
    }
    
    this.router.navigate(['/pago'], {
      state: {
        carrito: this.carrito,
        total: this.total,
        subtotal: this.subtotal,
        domicilio: this.domicilio,
        clima: this.clima // Incluir información del clima en el estado
      }
    });
  }

  continuarComprando() {
    this.router.navigate(['/home']);
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

  getItemImage(item: ItemCarrito): string {
    if (item.tipo === 'pizza') {
      return item.item.imagen || 'assets/images/pizza-default.jpg';
    } else {
      return item.item.imagen || 'assets/images/bebida-default.jpg';
    }
  }

  getItemDescription(item: ItemCarrito): string {
    if (item.tipo === 'pizza') {
      return (item.item as any).descripcion || '';
    }
    return `Tamaño: ${(item.item as any).tamano || ''}`;
  }

  // Métodos adicionales para mostrar información del clima en el template
  getTemperatura(): string {
    return this.clima?.main?.temp ? `${Math.round(this.clima.main.temp)}°C` : '';
  }

  getDescripcionClima(): string {
    return this.clima?.weather?.[0]?.description || '';
  }

  getIconoClima(): string {
    return this.clima?.weather?.[0]?.icon ? 
      `https://openweathermap.org/img/w/${this.clima.weather[0].icon}.png` : '';
  }
}