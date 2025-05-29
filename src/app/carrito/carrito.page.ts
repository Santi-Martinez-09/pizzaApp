import { Component, OnInit, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { WeatherService } from '../services/weather.service';
import { CarritoService } from '../services/carrito.service'; // Servicio adicional
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
  receiptOutline, pizzaOutline, basketOutline } from 'ionicons/icons';
import { PizzaService, ItemCarrito } from '../services/pizza/pizza.service';

// Declaración para PayPal
declare var paypal: any;

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

export class CarritoPage implements OnInit, AfterViewInit {
  carrito: ItemCarrito[] = [];
  carritoAdicional: any[] = []; // Para productos del CarritoService adicional
  subtotal: number = 0;
  domicilio: number = 5000; // Costo fijo de domicilio
  total: number = 0;
  totalAdicional: number = 0; // Total del servicio adicional
  clima: any;
  ciudad = 'Bogotá';
  
  constructor(
    private pizzaService: PizzaService,
    private carritoService: CarritoService, // Servicio adicional
    private router: Router,
    private alertController: AlertController,
    private toastController: ToastController,
    private weatherService: WeatherService
  ) {
    addIcons({trashOutline,cartOutline,pizzaOutline,removeOutline,addOutline,basketOutline,receiptOutline,locationOutline,cardOutline});
  }

  ngOnInit() {
    // Suscripción al carrito principal (PizzaService)
    this.pizzaService.carrito$.subscribe(carrito => {
      this.carrito = carrito;
      this.calcularTotales();
      // Recargar botón de PayPal cuando cambie el carrito
      setTimeout(() => this.loadPayPalButton(), 100);
    });

    // Cargar carrito adicional (CarritoService)
    this.carritoAdicional = this.carritoService.obtenerCarrito();
    this.totalAdicional = this.carritoService.obtenerTotal();

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

  ngAfterViewInit(): void {
    // Cargar el botón de PayPal después de que la vista se haya inicializado
    setTimeout(() => this.loadPayPalButton(), 500);
  }

  // Método trackBy para optimizar el rendimiento del *ngFor
  trackByItemId(index: number, item: ItemCarrito): number | string {
    return item.id || index;
  }

  // Método trackBy para el carrito adicional
  trackByAdditionalItemId(index: number, item: any): number | string {
    return item.id || index;
  }

  loadPayPalButton() {
    // Verificar que PayPal esté disponible y que haya items en el carrito
    const totalItems = this.carrito.length + this.carritoAdicional.length;
    if (typeof paypal !== 'undefined' && totalItems > 0) {
      // Limpiar el contenedor antes de crear un nuevo botón
      const container = document.getElementById('#paypal-button-container');
      if (container) {
        container.innerHTML = '';
      }

      // Calcular total combinado para PayPal
      const totalCombinado = this.total + this.totalAdicional;
      const totalUSD = (totalCombinado / 4000).toFixed(2); // 1 USD ≈ 4000 COP

      paypal.Buttons({
        createOrder: (data: any, actions: any) => {
          // Combinar items de ambos carritos para PayPal
          const itemsPayPal = [
            ...this.carrito.map(item => ({
              name: item.item.nombre,
              quantity: item.cantidad.toString(),
              unit_amount: {
                currency_code: 'USD',
                value: ((item.precio * item.cantidad) / 4000).toFixed(2)
              }
            })),
            ...this.carritoAdicional.map(item => ({
              name: item.nombre || 'Producto',
              quantity: item.cantidad?.toString() || '1',
              unit_amount: {
                currency_code: 'USD',
                value: ((item.precio || 0) / 4000).toFixed(2)
              }
            }))
          ];

          return actions.order.create({
            purchase_units: [{
              amount: {
                value: totalUSD,
                currency_code: 'USD'
              },
              description: `Pedido completo - ${totalItems} items`,
              items: itemsPayPal
            }]
          });
        },
        onApprove: (data: any, actions: any) => {
          return actions.order.capture().then((details: any) => {
            console.log('Pago completado:', details);
            this.pagoExitoso(details);
          });
        },
        onError: (err: any) => {
          console.error('Error en pago PayPal:', err);
          this.presentToast('Error al procesar el pago con PayPal', 'danger');
        },
        onCancel: (data: any) => {
          console.log('Pago cancelado:', data);
          this.presentToast('Pago cancelado', 'warning');
        }
      }).render('#paypal-button-container');
    }
  }

  async pagoExitoso(details: any) {
    // Mostrar mensaje de éxito
    const alert = await this.alertController.create({
      header: '¡Pago Exitoso!',
      message: `Gracias ${details.payer.name.given_name}! Tu pedido ha sido procesado correctamente.`,
      buttons: [
        {
          text: 'OK',
          handler: () => {
            // Limpiar ambos carritos después del pago exitoso
            this.pizzaService.limpiarCarrito();
            this.limpiarCarritoAdicional();
            // Navegar a la página de inicio o confirmación
            this.router.navigate(['/home']);
          }
        }
      ]
    });

    await alert.present();
  }

  calcularTotales() {
    // Calcular totales del carrito principal
    this.subtotal = this.carrito.reduce((total, item) => 
      total + (item.precio * item.cantidad), 0
    );
    this.total = this.subtotal + (this.carrito.length > 0 ? this.domicilio : 0);

    // Actualizar total del carrito adicional
    this.totalAdicional = this.carritoService.obtenerTotal();
  }

  formatPrice(price: number): string {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(price);
  }

  // Métodos para carrito principal (PizzaService)
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

  // Métodos para carrito adicional (CarritoService)
  eliminar(id: string) {
    this.carritoService.eliminarProducto(id);
    this.carritoAdicional = this.carritoService.obtenerCarrito();
    this.totalAdicional = this.carritoService.obtenerTotal();
    this.presentToast('Producto eliminado del carrito adicional');
  }

  limpiarCarritoAdicional() {
    // Si el CarritoService tiene un método para limpiar
    if (this.carritoService.limpiarCarrito) {
      this.carritoService.limpiarCarrito();
    } else {
      // Si no tiene método de limpiar, eliminar uno por uno
      this.carritoAdicional.forEach(item => {
        if (item.id) {
          this.carritoService.eliminarProducto(item.id);
        }
      });
    }
    this.carritoAdicional = [];
    this.totalAdicional = 0;
  }

  async limpiarCarrito() {
    const alert = await this.alertController.create({
      header: 'Limpiar carritos',
      message: '¿Deseas remover todos los items de ambos carritos?',
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Limpiar',
          handler: () => {
            this.pizzaService.limpiarCarrito();
            this.limpiarCarritoAdicional();
            this.presentToast('Carritos limpiados');
          }
        }
      ]
    });

    await alert.present();
  }

  procederAlPago() {
    const totalItems = this.carrito.length + this.carritoAdicional.length;
    if (totalItems === 0) {
      this.presentToast('Los carritos están vacíos', 'warning');
      return;
    }
    
    this.router.navigate(['/pago'], {
      state: {
        carrito: this.carrito,
        carritoAdicional: this.carritoAdicional,
        total: this.total + this.totalAdicional,
        subtotal: this.subtotal,
        totalAdicional: this.totalAdicional,
        domicilio: this.domicilio,
        clima: this.clima
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

  // Métodos para información del clima
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

  // Método para obtener el total combinado
  getTotalCombinado(): number {
    return this.total + this.totalAdicional;
  }

  // Método para verificar si hay items en cualquier carrito
  tieneItems(): boolean {
    return this.carrito.length > 0 || this.carritoAdicional.length > 0;
  }
}