import { Component, OnInit, AfterViewInit, OnDestroy } from '@angular/core';
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
  IonSpinner,
  AlertController,
  ToastController,
  LoadingController
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
import { PayPalLoaderService } from '../services/paypal.service';
import { Subscription } from 'rxjs';

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
    IonItemOption,
    IonSpinner
  ]
})
export class CarritoPage implements OnInit, AfterViewInit, OnDestroy {
  carrito: ItemCarrito[] = [];
  subtotal: number = 0;
  domicilio: number = 5000;
  total: number = 0;
  private carritoSubscription: Subscription | null = null;
  
  // Estados de PayPal
  paypalStatus: 'loading' | 'ready' | 'error' | 'unavailable' = 'loading';
  paypalMessage: string = 'Iniciando PayPal...';
  paypalButtonRendered = false;
  
  constructor(
    private pizzaService: PizzaService,
    private authService: AuthService,
    private paypalLoader: PayPalLoaderService,
    private router: Router,
    private alertController: AlertController,
    private toastController: ToastController,
    private loadingController: LoadingController
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

  async ngOnInit() {
    console.log('🛒 CarritoPage: Iniciando...');
    
    // Suscripción al carrito
    this.carritoSubscription = this.pizzaService.carrito$.subscribe(carrito => {
      console.log('🛒 Carrito actualizado:', carrito.length, 'items');
      this.carrito = [...carrito];
      this.calcularTotales();
      
      // Renderizar PayPal si hay items
      if (this.carrito.length > 0) {
        this.initializePayPal();
      } else {
        this.clearPayPalButton();
      }
    });

    // Cargar carrito inicial
    this.carrito = this.pizzaService.getCarrito();
    this.calcularTotales();
    
    console.log('🛒 Carrito inicial:', this.carrito.length, 'items');
  }

  async ngAfterViewInit() {
    console.log('🛒 Vista inicializada');
    
    // Inicializar PayPal si hay items
    if (this.carrito.length > 0) {
      await this.initializePayPal();
    }
  }

  ngOnDestroy() {
    console.log('🛒 Destruyendo componente');
    if (this.carritoSubscription) {
      this.carritoSubscription.unsubscribe();
    }
  }

  // Inicializar PayPal
  async initializePayPal() {
    console.log('💳 Inicializando PayPal...');
    this.updatePayPalStatus('loading', 'Cargando PayPal SDK...');
    
    try {
      // Cargar SDK dinámicamente
      const loaded = await this.paypalLoader.loadSDK();
      
      if (!loaded) {
        throw new Error('No se pudo cargar PayPal SDK');
      }

      this.updatePayPalStatus('ready', 'PayPal listo');
      console.log('✅ PayPal SDK cargado correctamente');
      
      // Renderizar botón
      await this.renderPayPalButton();
      
    } catch (error) {
      console.error('❌ Error inicializando PayPal:', error);
      this.updatePayPalStatus('error', `Error: ${error}`);
    }
  }

  // Renderizar botón de PayPal
  async renderPayPalButton() {
    if (this.carrito.length === 0) {
      console.log('💳 No hay items, no renderizar PayPal');
      return;
    }

    console.log('💳 Renderizando botón PayPal...');
    
    try {
      const paypal = this.paypalLoader.getPayPal();
      const container = document.getElementById('paypal-button-container');
      
      if (!container) {
        throw new Error('Contenedor PayPal no encontrado');
      }

      // Limpiar contenedor
      container.innerHTML = '';
      
      // Calcular total en USD
      const totalUSD = (this.total / 4000).toFixed(2);
      console.log('💳 Total:', this.total, 'COP =', totalUSD, 'USD');

      // Renderizar botón
      await paypal.Buttons({
        style: {
          layout: 'vertical',
          color: 'gold',
          shape: 'rect',
          label: 'paypal',
          height: 45
        },

        createOrder: (data: any, actions: any) => {
          console.log('💳 Creando orden PayPal...');
          
          return actions.order.create({
            purchase_units: [{
              amount: {
                value: totalUSD,
                currency_code: 'USD',
                breakdown: {
                  item_total: {
                    currency_code: 'USD',
                    value: (this.subtotal / 4000).toFixed(2)
                  },
                  shipping: {
                    currency_code: 'USD',
                    value: (this.domicilio / 4000).toFixed(2)
                  }
                }
              },
              description: `PizzaApp - ${this.carrito.length} items`,
              custom_id: `order_${Date.now()}`,
              items: this.carrito.map(item => ({
                name: item.item.nombre,
                quantity: item.cantidad.toString(),
                unit_amount: {
                  currency_code: 'USD',
                  value: (item.precio / 4000).toFixed(2)
                },
                category: 'PHYSICAL_GOODS'
              }))
            }],
            application_context: {
              brand_name: 'PizzaApp',
              locale: 'es_ES', // Cambiado de es_CO a es_ES
              landing_page: 'BILLING',
              shipping_preference: 'NO_SHIPPING',
              user_action: 'PAY_NOW'
            }
          });
        },

        onApprove: async (data: any, actions: any) => {
          const loading = await this.loadingController.create({
            message: 'Procesando pago...',
            spinner: 'crescent',
            backdropDismiss: false
          });
          await loading.present();

          try {
            const details = await actions.order.capture();
            console.log('💳 Pago capturado:', details);
            
            await loading.dismiss();
            await this.procesarPagoExitoso(details);
            
          } catch (error) {
            console.error('❌ Error capturando pago:', error);
            await loading.dismiss();
            this.presentToast('Error procesando el pago', 'danger');
          }
        },

        onError: (err: any) => {
          console.error('❌ Error PayPal:', err);
          this.presentToast('Error con PayPal. Intenta de nuevo.', 'danger');
        },

        onCancel: (data: any) => {
          console.log('❌ Pago cancelado');
          this.presentToast('Pago cancelado', 'warning');
        }

      }).render('#paypal-button-container');

      this.paypalButtonRendered = true;
      console.log('✅ Botón PayPal renderizado');
      
    } catch (error) {
      console.error('❌ Error renderizando PayPal:', error);
      this.updatePayPalStatus('error', `Error renderizando: ${error}`);
    }
  }

  // Procesar pago exitoso
  async procesarPagoExitoso(details: any) {
    console.log('🎉 Procesando pago exitoso');
    
    try {
      const currentUser = this.authService.getCurrentUser();
      if (!currentUser) {
        throw new Error('Usuario no autenticado');
      }

      const pedidoData = {
        userId: currentUser.uid,
        items: [...this.carrito],
        total: this.total,
        domicilio: this.domicilio,
        direccion: 'Dirección por defecto - PayPal',
        telefono: '000-000-0000',
        estado: 'pendiente' as const,
        fechaCreacion: new Date(),
        metodoPago: 'paypal',
        paypalTransactionId: details.id,
        paypalOrderId: details.purchase_units[0]?.payments?.captures[0]?.id || 'N/A'
      };

      const pedidoId = await this.pizzaService.crearPedido(pedidoData);
      console.log('✅ Pedido creado:', pedidoId);
      
      await this.mostrarExito(details, pedidoId);
      
    } catch (error) {
      console.error('❌ Error creando pedido:', error);
      await this.mostrarErrorPedido(details, error);
    }
  }

  // Mostrar mensaje de éxito
  async mostrarExito(details: any, pedidoId: string) {
    const alert = await this.alertController.create({
      header: '🎉 ¡Pago Exitoso!',
      message: `
        <div style="text-align: left; line-height: 1.6;">
          <p><strong>¡Gracias ${details.payer.name.given_name || 'por tu compra'}!</strong></p>
          <p>Tu pedido ha sido procesado correctamente.</p>
          <hr style="margin: 1rem 0;">
          <p><strong>📦 Pedido:</strong> #${pedidoId.substring(0, 8).toUpperCase()}</p>
          <p><strong>💰 Total:</strong> ${this.formatPrice(this.total)}</p>
          <p><strong>⏰ Tiempo:</strong> 30-45 minutos</p>
          <hr style="margin: 1rem 0;">
          <p>🍕 Tu pedido será preparado y enviado pronto</p>
        </div>
      `,
      buttons: [
        {
          text: '📋 Mis Pedidos',
          handler: () => this.router.navigate(['/pedidos'])
        },
        {
          text: '🛒 Seguir Comprando',
          handler: () => this.router.navigate(['/home'])
        }
      ],
      backdropDismiss: false
    });

    await alert.present();
  }

  // Mostrar error de pedido
  async mostrarErrorPedido(details: any, error: any) {
    const alert = await this.alertController.create({
      header: '⚠️ Error procesando pedido',
      message: `
        <div style="text-align: left;">
          <p>El pago se procesó correctamente, pero hubo un error guardando el pedido.</p>
          <p><strong>ID PayPal:</strong> ${details.id}</p>
          <p>Por favor contacta soporte técnico.</p>
        </div>
      `,
      buttons: ['Entendido']
    });
    
    await alert.present();
  }

  // Actualizar estado de PayPal
  updatePayPalStatus(status: typeof this.paypalStatus, message: string) {
    this.paypalStatus = status;
    this.paypalMessage = message;
    
    const statusElement = document.getElementById('paypal-status');
    if (statusElement) {
      let icon = '';
      let color = '';
      
      switch (status) {
        case 'loading':
          icon = '🔄';
          color = 'orange';
          break;
        case 'ready':
          icon = '✅';
          color = 'green';
          break;
        case 'error':
          icon = '❌';
          color = 'red';
          break;
        case 'unavailable':
          icon = '⚠️';
          color = 'gray';
          break;
      }
      
      statusElement.innerHTML = `${icon} ${message}`;
      statusElement.style.color = color;
    }
  }

  // Limpiar botón PayPal
  clearPayPalButton() {
    const container = document.getElementById('paypal-button-container');
    if (container) {
      container.innerHTML = `
        <div class="paypal-loading" style="text-align: center; color: #666; padding: 2rem;">
          <div style="font-size: 2rem; margin-bottom: 10px;">🛒</div>
          <p>Agrega productos para ver PayPal</p>
        </div>
      `;
    }
    this.paypalButtonRendered = false;
  }

  // Test manual de PayPal
  async testPayPalManual() {
    console.log('🧪 === TEST PAYPAL MANUAL ===');
    
    const loading = await this.loadingController.create({
      message: 'Ejecutando test de PayPal...',
      spinner: 'crescent'
    });
    await loading.present();

    try {
      const result = await this.paypalLoader.testConnectivity();
      await loading.dismiss();
      
      console.log('🧪 Resultado del test:', result);
      
      const alert = await this.alertController.create({
        header: result.success ? '✅ Test Exitoso' : '❌ Test Fallido',
        message: `
          <div style="text-align: left;">
            <p><strong>Estado:</strong> ${result.message}</p>
            <p><strong>Items:</strong> ${this.carrito.length}</p>
            <p><strong>Total:</strong> ${this.formatPrice(this.total)}</p>
            <hr>
            <h4>Debug Info:</h4>
            <pre style="font-size: 0.8rem; overflow: auto; max-height: 200px;">${JSON.stringify(result.details, null, 2)}</pre>
          </div>
        `,
        buttons: ['Cerrar']
      });
      
      await alert.present();
      
      if (result.success) {
        this.presentToast('✅ PayPal funcional', 'success');
        await this.renderPayPalButton();
      } else {
        this.presentToast('❌ PayPal con problemas', 'danger');
      }
      
    } catch (error) {
      await loading.dismiss();
      console.error('🧪 Error en test:', error);
      this.presentToast('Error ejecutando test', 'danger');
    }
  }

  // Recargar PayPal
  async reloadPayPal() {
    console.log('🔄 Recargando PayPal...');
    
    this.updatePayPalStatus('loading', 'Recargando PayPal...');
    this.paypalLoader.reset();
    
    await this.initializePayPal();
    
    this.presentToast('PayPal recargado', 'success');
  }

  // Métodos del carrito (sin cambios)
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
      message: `¿Deseas remover "${item.item.nombre}" del carrito?`,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
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
    if (this.carrito.length === 0) {
      this.presentToast('El carrito ya está vacío', 'warning');
      return;
    }

    const alert = await this.alertController.create({
      header: 'Limpiar carrito',
      message: `¿Deseas remover todos los ${this.carrito.length} items?`,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Limpiar todo',
          handler: () => {
            this.pizzaService.limpiarCarrito();
            this.presentToast('Carrito limpiado');
          }
        }
      ]
    });
    await alert.present();
  }

  continuarComprando() {
    this.router.navigate(['/home']);
  }

  async procederAlPago() {
    this.presentToast('Pago tradicional en desarrollo. Usa PayPal.', 'warning');
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

  getItemImage(item: ItemCarrito): string {
    return item.tipo === 'pizza' 
      ? item.item.imagen || 'assets/images/pizza-default.jpg'
      : item.item.imagen || 'assets/images/bebida-default.jpg';
  }

  getItemDescription(item: ItemCarrito): string {
    return item.tipo === 'pizza' 
      ? (item.item as any).descripcion || ''
      : `Tamaño: ${(item.item as any).tamano || ''}`;
  }

  tieneItems(): boolean {
    return this.carrito.length > 0;
  }

  trackByItemId(index: number, item: ItemCarrito): string {
    return item.id;
  }
}