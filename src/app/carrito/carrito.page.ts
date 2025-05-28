import { Component, OnInit, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
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
import { AuthService } from '../services/auth.service';

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
    IonItemSliding,
    IonItemOptions,
    IonItemOption
  ]
})
export class CarritoPage implements OnInit, AfterViewInit {
  carrito: ItemCarrito[] = [];
  subtotal: number = 0;
  domicilio: number = 5000; // Costo fijo de domicilio
  total: number = 0;
  
  constructor(
    private pizzaService: PizzaService,
    private authService: AuthService,
    private router: Router,
    private alertController: AlertController,
    private toastController: ToastController
  ) {
    addIcons({
      trashOutline,
      cartOutline,
      removeOutline,
      addOutline,
      receiptOutline,
      locationOutline,
      cardOutline
    });
  }

  ngOnInit() {
    console.log('CarritoPage: Iniciando...');
    
    // Suscripción al carrito del servicio
    this.pizzaService.carrito$.subscribe(carrito => {
      console.log('CarritoPage: Carrito actualizado:', carrito);
      this.carrito = carrito;
      this.calcularTotales();
      
      // Recargar botón de PayPal cuando cambie el carrito
      setTimeout(() => this.loadPayPalButton(), 100);
    });

    // Cargar carrito inicial
    this.carrito = this.pizzaService.getCarrito();
    this.calcularTotales();
  }

  ngAfterViewInit(): void {
    // Cargar el botón de PayPal después de que la vista se haya inicializado
    setTimeout(() => this.loadPayPalButton(), 500);
  }

  loadPayPalButton() {
    // Verificar que PayPal esté disponible y que haya items en el carrito
    if (typeof paypal !== 'undefined' && this.carrito.length > 0) {
      console.log('Cargando botón PayPal para total:', this.total);
      
      // Limpiar el contenedor antes de crear un nuevo botón
      const container = document.getElementById('paypal-button-container');
      if (container) {
        container.innerHTML = '';
      }

      // Calcular total en USD (asumiendo 1 USD = 4000 COP)
      const totalUSD = (this.total / 4000).toFixed(2);
      console.log('Total en USD:', totalUSD);

      paypal.Buttons({
        createOrder: (data: any, actions: any) => {
          const itemsPayPal = this.carrito.map(item => ({
            name: item.item.nombre,
            quantity: item.cantidad.toString(),
            unit_amount: {
              currency_code: 'USD',
              value: ((item.precio) / 4000).toFixed(2)
            }
          }));

          return actions.order.create({
            purchase_units: [{
              amount: {
                value: totalUSD,
                currency_code: 'USD'
              },
              description: `Pedido de pizzas - ${this.carrito.length} items`,
              items: itemsPayPal
            }]
          });
        },
        onApprove: (data: any, actions: any) => {
          return actions.order.capture().then((details: any) => {
            console.log('Pago completado:', details);
            this.pagoExitosoPayPal(details);
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
    } else {
      console.log('PayPal no disponible o carrito vacío');
    }
  }

  async pagoExitosoPayPal(details: any) {
    console.log('Procesando pago exitoso de PayPal');
    
    try {
      // Crear el pedido en Firebase
      const currentUser = this.authService.getCurrentUser();
      const pedidoData = {
        userId: currentUser?.uid || 'guest-user',
        items: this.carrito,
        total: this.total,
        domicilio: this.domicilio,
        direccion: 'Dirección por defecto - PayPal', // En producción esto debería venir de un formulario
        telefono: '000-000-0000', // En producción esto debería venir de un formulario
        estado: 'pendiente' as const,
        fechaCreacion: new Date(),
        metodoPago: 'paypal',
        paypalTransactionId: details.id
      };

      const pedidoId = await this.pizzaService.crearPedido(pedidoData);
      console.log('Pedido creado con ID:', pedidoId);
      
      // Mostrar mensaje de éxito
      const alert = await this.alertController.create({
        header: '¡Pago Exitoso con PayPal!',
        message: `
          <div style="text-align: left;">
            <p><strong>Gracias ${details.payer.name.given_name}!</strong></p>
            <p>Tu pedido ha sido procesado correctamente.</p>
            <p><strong>ID del pedido:</strong> ${pedidoId.substring(0, 8).toUpperCase()}</p>
            <p><strong>Total pagado:</strong> ${this.formatPrice(this.total)}</p>
            <p><strong>Transacción PayPal:</strong> ${details.id}</p>
            <br>
            <p>Tu pedido será preparado y enviado en 30-45 minutos.</p>
          </div>
        `,
        buttons: [
          {
            text: 'Ver mis pedidos',
            handler: () => {
              this.router.navigate(['/pedidos']);
            }
          },
          {
            text: 'Seguir comprando',
            handler: () => {
              this.router.navigate(['/home']);
            }
          }
        ]
      });

      await alert.present();
      
    } catch (error) {
      console.error('Error creando pedido después de PayPal:', error);
      this.presentToast('Error al crear el pedido. Contacta soporte.', 'danger');
    }
  }

  calcularTotales() {
    this.subtotal = this.carrito.reduce((total, item) => 
      total + (item.precio * item.cantidad), 0
    );
    this.total = this.subtotal + (this.carrito.length > 0 ? this.domicilio : 0);
    
    console.log('Totales calculados - Subtotal:', this.subtotal, 'Total:', this.total);
  }

  formatPrice(price: number): string {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(price);
  }

  aumentarCantidad(item: ItemCarrito) {
    console.log('Aumentando cantidad de:', item.item.nombre);
    this.pizzaService.actualizarCantidad(item.id, item.cantidad + 1);
  }

  disminuirCantidad(item: ItemCarrito) {
    console.log('Disminuyendo cantidad de:', item.item.nombre);
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
            console.log('Removiendo item:', item.item.nombre);
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
            console.log('Limpiando carrito completo');
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
    
    console.log('Navegando a página de pago con:', {
      carrito: this.carrito,
      total: this.total,
      subtotal: this.subtotal,
      domicilio: this.domicilio
    });
    
    this.router.navigate(['/pago'], {
      state: {
        carrito: this.carrito,
        total: this.total,
        subtotal: this.subtotal,
        domicilio: this.domicilio
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

  tieneItems(): boolean {
    return this.carrito.length > 0;
  }

  // Track function para optimizar el ngFor
  trackByItemId(index: number, item: ItemCarrito): string {
    return item.id;
  }
}