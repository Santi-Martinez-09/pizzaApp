import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
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
  IonList,
  IonItem,
  IonLabel,
  IonBadge,
  IonButton,
  IonIcon,
  IonNote,
  IonRefresher,
  IonRefresherContent,
  AlertController,
  ToastController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  receiptOutline,
  timeOutline,
  checkmarkCircleOutline,
  closeCircleOutline,
  refreshOutline,
  mapOutline,
  callOutline
} from 'ionicons/icons';
import { AuthService } from '../services/auth.service';
import { PizzaService, Pedido, ItemCarrito } from '../services/pizza/pizza.service';

@Component({
  selector: 'app-pedidos',
  templateUrl: './pedidos.page.html',
  styleUrls: ['./pedidos.page.scss'],
  standalone: true,
  providers: [PizzaService, AuthService],
  imports: [
    CommonModule,
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
    IonList,
    IonItem,
    IonLabel,
    IonBadge,
    IonButton,
    IonIcon,
    IonNote,
    IonRefresher,
    IonRefresherContent
  ]
})
export class PedidosPage implements OnInit {
  pedidos: Pedido[] = [];
  isLoading: boolean = false;

  constructor(
    private authService: AuthService,
    private pizzaService: PizzaService,
    private router: Router,
    private alertController: AlertController,
    private toastController: ToastController
  ) {
    addIcons({
      receiptOutline,
      timeOutline,
      checkmarkCircleOutline,
      closeCircleOutline,
      refreshOutline,
      mapOutline,
      callOutline
    });
  }

  async ngOnInit() {
    await this.loadPedidos();
  }

  async loadPedidos(event?: any) {
    this.isLoading = true;
    
    try {
      const currentUser = this.authService.getCurrentUser();
      if (currentUser) {
        this.pedidos = await this.pizzaService.getPedidosByUser(currentUser.uid);
      }
    } catch (error) {
      console.error('Error cargando pedidos:', error);
      this.presentToast('Error cargando pedidos', 'danger');
    } finally {
      this.isLoading = false;
      if (event) {
        event.target.complete();
      }
    }
  }

  formatPrice(price: number): string {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(price);
  }

  formatDate(date: Date): string {
    if (!date) return 'Sin fecha';
    
    const dateObj = date instanceof Date ? date : new Date(date);
    return dateObj.toLocaleDateString('es-CO', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  getEstadoBadgeColor(estado: string): string {
    const colors: { [key: string]: string } = {
      'pendiente': 'warning',
      'preparando': 'primary',
      'enviado': 'secondary',
      'entregado': 'success',
      'cancelado': 'danger'
    };
    return colors[estado] || 'medium';
  }

  getEstadoIcon(estado: string): string {
    const icons: { [key: string]: string } = {
      'pendiente': 'time-outline',
      'preparando': 'restaurant-outline',
      'enviado': 'car-outline',
      'entregado': 'checkmark-circle-outline',
      'cancelado': 'close-circle-outline'
    };
    return icons[estado] || 'ellipse-outline';
  }

  getEstadoText(estado: string): string {
    const texts: { [key: string]: string } = {
      'pendiente': 'Pendiente',
      'preparando': 'Preparando',
      'enviado': 'En camino',
      'entregado': 'Entregado',
      'cancelado': 'Cancelado'
    };
    return texts[estado] || estado;
  }

  async verDetallesPedido(pedido: Pedido) {
    const itemsList = pedido.items.map((item: ItemCarrito) => 
      `• ${item.item.nombre} x${item.cantidad} - ${this.formatPrice(item.precio * item.cantidad)}`
    ).join('<br>');

    const alert = await this.alertController.create({
      header: `Pedido #${(pedido.id?.substring(0, 8) || 'TEMP').toUpperCase()}`,
      message: `
        <div style="text-align: left;">
          <h4>Items:</h4>
          <p>${itemsList}</p>
          
          <h4>Información de entrega:</h4>
          <p><strong>Dirección:</strong> ${pedido.direccion}</p>
          <p><strong>Teléfono:</strong> ${pedido.telefono}</p>
          
          <h4>Resumen:</h4>
          <p><strong>Subtotal:</strong> ${this.formatPrice(pedido.total - 5000)}</p>
          <p><strong>Domicilio:</strong> ${this.formatPrice(5000)}</p>
          <p><strong>Total:</strong> ${this.formatPrice(pedido.total)}</p>
          <p><strong>Método de pago:</strong> ${this.getPaymentMethodName(pedido.metodoPago)}</p>
          
          <p><strong>Estado:</strong> ${this.getEstadoText(pedido.estado)}</p>
          <p><strong>Fecha:</strong> ${this.formatDate(pedido.fechaCreacion)}</p>
          ${pedido.fechaEntrega ? `<p><strong>Entregado:</strong> ${this.formatDate(pedido.fechaEntrega)}</p>` : ''}
        </div>
      `,
      buttons: [
        {
          text: 'Cerrar',
          role: 'cancel'
        },
        {
          text: 'Rastrear',
          handler: () => {
            this.rastrearPedido(pedido);
          }
        }
      ]
    });

    await alert.present();
  }

  getPaymentMethodName(method: string): string {
    const methods: { [key: string]: string } = {
      'paypal': 'PayPal',
      'payu': 'Tarjeta de crédito',
      'cash': 'Efectivo',
      'bank_transfer': 'Transferencia bancaria'
    };
    return methods[method] || method;
  }

  async rastrearPedido(pedido: Pedido) {
    const alert = await this.alertController.create({
      header: 'Rastrear Pedido',
      message: `
        <div style="text-align: left;">
          <p><strong>Estado actual:</strong> ${this.getEstadoText(pedido.estado)}</p>
          
          <div style="margin: 1rem 0;">
            <h4>Proceso de entrega:</h4>
            <div style="display: flex; flex-direction: column; gap: 0.5rem;">
              <div style="display: flex; align-items: center; gap: 0.5rem; ${pedido.estado === 'pendiente' || pedido.estado === 'preparando' || pedido.estado === 'enviado' || pedido.estado === 'entregado' ? 'color: #10dc60;' : ''}">
                ✓ Pedido recibido
              </div>
              <div style="display: flex; align-items: center; gap: 0.5rem; ${pedido.estado === 'preparando' || pedido.estado === 'enviado' || pedido.estado === 'entregado' ? 'color: #10dc60;' : 'color: #ccc;'}">
                ${pedido.estado === 'preparando' || pedido.estado === 'enviado' || pedido.estado === 'entregado' ? '✓' : '○'} Preparando pizza
              </div>
              <div style="display: flex; align-items: center; gap: 0.5rem; ${pedido.estado === 'enviado' || pedido.estado === 'entregado' ? 'color: #10dc60;' : 'color: #ccc;'}">
                ${pedido.estado === 'enviado' || pedido.estado === 'entregado' ? '✓' : '○'} En camino
              </div>
              <div style="display: flex; align-items: center; gap: 0.5rem; ${pedido.estado === 'entregado' ? 'color: #10dc60;' : 'color: #ccc;'}">
                ${pedido.estado === 'entregado' ? '✓' : '○'} Entregado
              </div>
            </div>
          </div>
          
          <p><strong>Tiempo estimado:</strong> ${this.getEstimatedTime(pedido)}</p>
        </div>
      `,
      buttons: [
        {
          text: 'Ver en mapa',
          handler: () => {
            this.verEnMapa(pedido);
          }
        },
        {
          text: 'Cerrar'
        }
      ]
    });

    await alert.present();
  }

  getEstimatedTime(pedido: Pedido): string {
    if (pedido.estado === 'entregado') {
      return 'Entregado';
    }
    if (pedido.estado === 'cancelado') {
      return 'Cancelado';
    }
    
    const now = new Date();
    const pedidoDate = pedido.fechaCreacion instanceof Date ? pedido.fechaCreacion : new Date(pedido.fechaCreacion);
    const minutosTranscurridos = Math.floor((now.getTime() - pedidoDate.getTime()) / (1000 * 60));
    const minutosRestantes = Math.max(0, 45 - minutosTranscurridos);
    
    if (minutosRestantes === 0) {
      return 'Llegando pronto';
    }
    
    return `${minutosRestantes} minutos aproximadamente`;
  }

  async verEnMapa(pedido: Pedido) {
    const alert = await this.alertController.create({
      header: 'Ubicación',
      message: 'Esta función estará disponible próximamente. Podrás ver la ubicación de tu pedido en tiempo real.',
      buttons: ['OK']
    });
    await alert.present();
  }

  async cancelarPedido(pedido: Pedido) {
    if (pedido.estado === 'entregado' || pedido.estado === 'cancelado') {
      this.presentToast('Este pedido no se puede cancelar', 'warning');
      return;
    }

    const alert = await this.alertController.create({
      header: 'Cancelar Pedido',
      message: '¿Estás seguro de que deseas cancelar este pedido?',
      buttons: [
        {
          text: 'No',
          role: 'cancel'
        },
        {
          text: 'Sí, cancelar',
          handler: async () => {
            try {
              if (pedido.id) {
                await this.pizzaService.updatePedidoEstado(pedido.id, 'cancelado');
                await this.loadPedidos();
                this.presentToast('Pedido cancelado exitosamente');
              }
            } catch (error) {
              console.error('Error cancelando pedido:', error);
              this.presentToast('Error cancelando pedido', 'danger');
            }
          }
        }
      ]
    });

    await alert.present();
  }

  goToHome() {
    this.router.navigate(['/home']);
  }

  private async presentToast(message: string, color: 'success' | 'danger' | 'warning' = 'success') {
    const toast = await this.toastController.create({
      message,
      duration: 3000,
      position: 'top',
      color
    });
    await toast.present();
  }
}