// src/app/admin-pedidos/admin-pedidos.page.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonContent,
  IonHeader,
  IonTitle,
  IonToolbar,
  IonButtons,
  IonMenuButton,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonList,
  IonItem,
  IonLabel,
  IonButton,
  IonIcon,
  IonBadge,
  IonChip,
  IonGrid,
  IonRow,
  IonCol,
  IonSearchbar,
  IonSegment,
  IonSegmentButton,
  IonRefresher,
  IonRefresherContent,
  IonSpinner,
  IonSelect,
  IonSelectOption,
  IonNote,
  AlertController,
  ToastController,
  LoadingController,
  ActionSheetController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  receiptOutline,
  timeOutline,
  checkmarkCircleOutline,
  closeCircleOutline,
  refreshOutline,
  mapOutline,
  callOutline,
  restaurantOutline,
  carOutline,
  eyeOutline,
  createOutline,
  statsChartOutline,
  filterOutline,
  searchOutline,
  checkmarkOutline,
  closeOutline,
  alertCircleOutline,
  cashOutline,
  personOutline,
  locationOutline
} from 'ionicons/icons';
import { Subscription, interval } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { PizzaService, Pedido, ItemCarrito } from '../services/pizza/pizza.service';

interface EstadoPedido {
  key: 'pendiente' | 'preparando' | 'enviado' | 'entregado' | 'cancelado';
  label: string;
  color: string;
  icon: string;
  description: string;
}

@Component({
  selector: 'app-admin-pedidos',
  templateUrl: './admin-pedidos.page.html',
  styleUrls: ['./admin-pedidos.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonContent,
    IonHeader,
    IonTitle,
    IonToolbar,
    IonButtons,
    IonMenuButton,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonList,
    IonItem,
    IonLabel,
    IonButton,
    IonIcon,
    IonBadge,
    IonChip,
    IonGrid,
    IonRow,
    IonCol,
    IonSearchbar,
    IonSegment,
    IonSegmentButton,
    IonRefresher,
    IonRefresherContent,
    IonSpinner,
    IonSelect,
    IonSelectOption,
    IonNote
  ]
})
export class AdminPedidosPage implements OnInit, OnDestroy {
  pedidos: Pedido[] = [];
  pedidosFiltrados: Pedido[] = [];
  isLoading: boolean = false;
  
  // Filtros y búsqueda
  selectedSegment: 'todos' | 'pendiente' | 'preparando' | 'enviado' | 'entregado' = 'todos';
  searchTerm: string = '';
  
  // Actualización automática
  private autoRefreshSubscription: Subscription | null = null;
  autoRefreshEnabled: boolean = true;
  
  // Estados disponibles
  estadosDisponibles: EstadoPedido[] = [
    {
      key: 'pendiente',
      label: 'Pendiente',
      color: 'warning',
      icon: 'time-outline',
      description: 'Pedido recibido, esperando preparación'
    },
    {
      key: 'preparando',
      label: 'Preparando',
      color: 'primary',
      icon: 'restaurant-outline',
      description: 'Pizza en preparación'
    },
    {
      key: 'enviado',
      label: 'En Camino',
      color: 'secondary',
      icon: 'car-outline',
      description: 'Pedido enviado al cliente'
    },
    {
      key: 'entregado',
      label: 'Entregado',
      color: 'success',
      icon: 'checkmark-circle-outline',
      description: 'Pedido entregado exitosamente'
    },
    {
      key: 'cancelado',
      label: 'Cancelado',
      color: 'danger',
      icon: 'close-circle-outline',
      description: 'Pedido cancelado'
    }
  ];
  
  // Estadísticas
  estadisticas = {
    total: 0,
    pendientes: 0,
    preparando: 0,
    enviados: 0,
    entregados: 0,
    cancelados: 0,
    ingresosDia: 0,
    tiempoPromedio: 0
  };

  constructor(
    private authService: AuthService,
    private pizzaService: PizzaService,
    private alertController: AlertController,
    private toastController: ToastController,
    private loadingController: LoadingController,
    private actionSheetController: ActionSheetController
  ) {
    addIcons({
      receiptOutline,
      timeOutline,
      checkmarkCircleOutline,
      closeCircleOutline,
      refreshOutline,
      mapOutline,
      callOutline,
      restaurantOutline,
      carOutline,
      eyeOutline,
      createOutline,
      statsChartOutline,
      filterOutline,
      searchOutline,
      checkmarkOutline,
      closeOutline,
      alertCircleOutline,
      cashOutline,
      personOutline,
      locationOutline
    });
  }

  async ngOnInit() {
    console.log('👑 AdminPedidosPage: Inicializando...');
    
    // Verificar permisos de administrador
    if (!this.authService.isAdmin()) {
      console.error('❌ Acceso denegado - no es administrador');
      this.presentToast('Acceso denegado', 'danger');
      return;
    }
    
    await this.loadPedidos();
    this.startAutoRefresh();
  }

  ngOnDestroy() {
    if (this.autoRefreshSubscription) {
      this.autoRefreshSubscription.unsubscribe();
    }
  }

  async loadPedidos() {
    this.isLoading = true;
    
    try {
      console.log('👑 Cargando todos los pedidos...');
      
      this.pedidos = await this.pizzaService.getAllPedidos();
      this.aplicarFiltros();
      this.calcularEstadisticas();
      
      console.log('✅ Pedidos cargados:', this.pedidos.length);
      
    } catch (error) {
      console.error('❌ Error cargando pedidos:', error);
      this.presentToast('Error cargando pedidos', 'danger');
    } finally {
      this.isLoading = false;
    }
  }

  async refreshPedidos(event?: any) {
    console.log('🔄 Refrescando pedidos...');
    await this.loadPedidos();
    
    if (event) {
      event.target.complete();
    }
    
    this.presentToast('Pedidos actualizados', 'success');
  }

  onSegmentChange(event: any) {
    this.selectedSegment = event.detail.value;
    this.aplicarFiltros();
  }

  onSearchChange(event: any) {
    this.searchTerm = event.detail.value.toLowerCase();
    this.aplicarFiltros();
  }

  aplicarFiltros() {
    let pedidosFiltrados = [...this.pedidos];
    
    // Filtrar por estado
    if (this.selectedSegment !== 'todos') {
      pedidosFiltrados = pedidosFiltrados.filter(pedido => 
        this.getEstadoPedido(pedido) === this.selectedSegment
      );
    }
    
    // Filtrar por término de búsqueda
    if (this.searchTerm.trim()) {
      pedidosFiltrados = pedidosFiltrados.filter(pedido =>
        this.getPedidoId(pedido).toLowerCase().includes(this.searchTerm) ||
        this.getDireccion(pedido).toLowerCase().includes(this.searchTerm) ||
        this.getTelefono(pedido).includes(this.searchTerm) ||
        this.getItems(pedido).some(item => 
          item?.item?.nombre?.toLowerCase().includes(this.searchTerm)
        )
      );
    }
    
    // Ordenar por fecha (más recientes primero)
    pedidosFiltrados.sort((a, b) => {
      const fechaA = a?.fechaCreacion instanceof Date ? a.fechaCreacion : new Date(a?.fechaCreacion || 0);
      const fechaB = b?.fechaCreacion instanceof Date ? b.fechaCreacion : new Date(b?.fechaCreacion || 0);
      return fechaB.getTime() - fechaA.getTime();
    });
    
    this.pedidosFiltrados = pedidosFiltrados;
  }

  calcularEstadisticas() {
    this.estadisticas = {
      total: this.pedidos.length,
      pendientes: this.pedidos.filter(p => this.getEstadoPedido(p) === 'pendiente').length,
      preparando: this.pedidos.filter(p => this.getEstadoPedido(p) === 'preparando').length,
      enviados: this.pedidos.filter(p => this.getEstadoPedido(p) === 'enviado').length,
      entregados: this.pedidos.filter(p => this.getEstadoPedido(p) === 'entregado').length,
      cancelados: this.pedidos.filter(p => this.getEstadoPedido(p) === 'cancelado').length,
      ingresosDia: this.calcularIngresosDia(),
      tiempoPromedio: this.calcularTiempoPromedio()
    };
  }

  private calcularIngresosDia(): number {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    
    return this.pedidos
      .filter(pedido => {
        const fechaPedido = pedido?.fechaCreacion instanceof Date ? 
          pedido.fechaCreacion : new Date(pedido?.fechaCreacion || 0);
        return fechaPedido >= hoy && this.getEstadoPedido(pedido) === 'entregado';
      })
      .reduce((total, pedido) => total + (pedido?.total || 0), 0);
  }

  private calcularTiempoPromedio(): number {
    const pedidosEntregados = this.pedidos.filter(p => 
      this.getEstadoPedido(p) === 'entregado' && p?.fechaEntrega
    );
    
    if (pedidosEntregados.length === 0) return 0;
    
    const tiempoTotal = pedidosEntregados.reduce((total, pedido) => {
      const fechaCreacion = pedido?.fechaCreacion instanceof Date ? 
        pedido.fechaCreacion : new Date(pedido?.fechaCreacion || 0);
      const fechaEntrega = pedido?.fechaEntrega instanceof Date ? 
        pedido.fechaEntrega : new Date(pedido?.fechaEntrega || 0);
      
      return total + (fechaEntrega.getTime() - fechaCreacion.getTime());
    }, 0);
    
    return Math.round(tiempoTotal / pedidosEntregados.length / (1000 * 60)); // minutos
  }

  async cambiarEstadoPedido(pedido: Pedido) {
    const actionSheet = await this.actionSheetController.create({
      header: `Cambiar estado - Pedido #${this.getPedidoId(pedido)}`,
      buttons: [
        ...this.estadosDisponibles
          .filter(estado => estado.key !== this.getEstadoPedido(pedido))
          .map(estado => ({
            text: `${this.getEstadoIcon(estado.key)} ${estado.label}`,
            handler: () => this.confirmarCambioEstado(pedido, estado.key)
          })),
        {
          text: 'Cancelar',
          role: 'cancel'
        }
      ]
    });

    await actionSheet.present();
  }

  async confirmarCambioEstado(pedido: Pedido, nuevoEstado: Pedido['estado']) {
    const estadoInfo = this.estadosDisponibles.find(e => e.key === nuevoEstado);
    
    const alert = await this.alertController.create({
      header: 'Confirmar cambio de estado',
      message: `
        <div style="text-align: left;">
          <p><strong>Pedido:</strong> #${this.getPedidoId(pedido)}</p>
          <p><strong>Cliente:</strong> ${this.getDireccion(pedido)}</p>
          <hr>
          <p><strong>Estado actual:</strong> ${this.getEstadoText(this.getEstadoPedido(pedido))}</p>
          <p><strong>Nuevo estado:</strong> ${estadoInfo?.label || 'Desconocido'}</p>
          <p style="color: #666; font-size: 0.9em;">${estadoInfo?.description || ''}</p>
        </div>
      `,
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Confirmar',
          handler: async () => {
            await this.actualizarEstadoPedido(pedido, nuevoEstado);
          }
        }
      ]
    });

    await alert.present();
  }

  async actualizarEstadoPedido(pedido: Pedido, nuevoEstado: Pedido['estado']) {
    const loading = await this.loadingController.create({
      message: 'Actualizando estado...',
      spinner: 'crescent'
    });
    await loading.present();

    try {
      if (!pedido?.id) {
        throw new Error('ID del pedido no válido');
      }

      await this.pizzaService.updatePedidoEstado(pedido.id, nuevoEstado);
      
      // Actualizar localmente
      const index = this.pedidos.findIndex(p => p?.id === pedido.id);
      if (index !== -1) {
        this.pedidos[index].estado = nuevoEstado;
        if (nuevoEstado === 'entregado') {
          this.pedidos[index].fechaEntrega = new Date();
        }
      }
      
      this.aplicarFiltros();
      this.calcularEstadisticas();
      
      await loading.dismiss();
      this.presentToast(
        `Pedido actualizado a: ${this.getEstadoText(nuevoEstado)}`,
        'success'
      );
      
    } catch (error) {
      await loading.dismiss();
      console.error('❌ Error actualizando estado:', error);
      this.presentToast('Error actualizando el pedido', 'danger');
    }
  }

  async verDetallesPedido(pedido: Pedido) {
    const itemsList = this.getItems(pedido).map((item: ItemCarrito) => 
      `• ${item?.item?.nombre || 'Producto sin nombre'} x${item?.cantidad || 0} - ${this.formatPrice((item?.precio || 0) * (item?.cantidad || 0))}`
    ).join('<br>');

    const fechaCreacion = this.formatDate(pedido?.fechaCreacion);
    const fechaEntrega = pedido?.fechaEntrega ? this.formatDate(pedido.fechaEntrega) : 'No entregado';

    const alert = await this.alertController.create({
      header: `📦 Pedido #${this.getPedidoId(pedido)}`,
      message: `
        <div style="text-align: left; max-height: 400px; overflow-y: auto;">
          <h4>🛒 Items del pedido:</h4>
          <div style="background: #f5f5f5; padding: 10px; border-radius: 5px; margin: 10px 0;">
            ${itemsList || 'Sin items'}
          </div>
          
          <h4>📍 Información de entrega:</h4>
          <p><strong>Dirección:</strong> ${this.getDireccion(pedido)}</p>
          <p><strong>Teléfono:</strong> ${this.getTelefono(pedido)}</p>
          ${pedido?.datosEntrega ? `
            <p><strong>Nombre:</strong> ${this.getClienteName(pedido)}</p>
            <p><strong>Detalles:</strong> ${pedido.datosEntrega.detalles || 'Ninguno'}</p>
          ` : ''}
          
          <h4>💰 Información de pago:</h4>
          <p><strong>Subtotal:</strong> ${this.formatPrice(this.getSubtotal(pedido))}</p>
          <p><strong>Domicilio:</strong> ${this.formatPrice(pedido?.domicilio || 0)}</p>
          <p><strong>Total:</strong> ${this.formatPrice(pedido?.total || 0)}</p>
          <p><strong>Método:</strong> ${this.getPaymentMethodName(pedido?.metodoPago || 'desconocido')}</p>
          ${pedido?.paypalTransactionId ? `<p><strong>ID PayPal:</strong> ${pedido.paypalTransactionId}</p>` : ''}
          
          <h4>📅 Fechas:</h4>
          <p><strong>Creado:</strong> ${fechaCreacion}</p>
          <p><strong>Entregado:</strong> ${fechaEntrega}</p>
          
          <h4>📊 Estado actual:</h4>
          <p style="color: var(--ion-color-${this.getEstadoBadgeColor(this.getEstadoPedido(pedido))});">
            <strong>${this.getEstadoIcon(this.getEstadoPedido(pedido))} ${this.getEstadoText(this.getEstadoPedido(pedido))}</strong>
          </p>
        </div>
      `,
      buttons: [
        {
          text: 'Cerrar',
          role: 'cancel'
        },
        {
          text: 'Cambiar Estado',
          handler: () => {
            this.cambiarEstadoPedido(pedido);
          }
        }
      ]
    });

    await alert.present();
  }

  // Auto-refresh automático
  private startAutoRefresh() {
    if (this.autoRefreshEnabled) {
      this.autoRefreshSubscription = interval(30000) // cada 30 segundos
        .subscribe(() => {
          if (!this.isLoading) {
            this.loadPedidos();
          }
        });
    }
  }

  toggleAutoRefresh() {
    this.autoRefreshEnabled = !this.autoRefreshEnabled;
    
    if (this.autoRefreshEnabled) {
      this.startAutoRefresh();
      this.presentToast('Auto-actualización activada', 'success');
    } else {
      if (this.autoRefreshSubscription) {
        this.autoRefreshSubscription.unsubscribe();
      }
      this.presentToast('Auto-actualización desactivada', 'warning');
    }
  }

  // ============ MÉTODOS AUXILIARES SEGUROS ============

  // Método seguro para obtener el ID del pedido
  getPedidoId(pedido: Pedido): string {
    return pedido?.id ? pedido.id.substring(0, 8).toUpperCase() : 'TEMP';
  }

  // Método seguro para obtener el nombre del cliente
  getClienteName(pedido: Pedido): string {
    return pedido?.datosEntrega?.nombre || 'Cliente sin nombre';
  }

  // Método seguro para obtener la dirección
  getDireccion(pedido: Pedido): string {
    return pedido?.direccion || 'Sin dirección especificada';
  }

  // Método seguro para obtener el teléfono
  getTelefono(pedido: Pedido): string {
    return pedido?.telefono || 'Sin teléfono';
  }

  // Método seguro para obtener el total de items
  getTotalItems(pedido: Pedido): number {
    return pedido?.items?.length || 0;
  }

  // Método seguro para obtener items del pedido
  getItems(pedido: Pedido): ItemCarrito[] {
    return pedido?.items || [];
  }

  // Método seguro para calcular subtotal
  getSubtotal(pedido: Pedido): number {
    return (pedido?.total || 0) - (pedido?.domicilio || 0);
  }

  // Método seguro para el estado del pedido
  getEstadoPedido(pedido: Pedido): string {
    return pedido?.estado || 'pendiente';
  }

  // Método para verificar si un pedido es válido
  isPedidoValido(pedido: Pedido): boolean {
    return !!(pedido && pedido.id && pedido.items && pedido.items.length > 0);
  }

  // ============ MÉTODOS DE UTILIDAD ============

  formatPrice(price: number): string {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(price || 0);
  }

  formatDate(date: Date | any): string {
    if (!date) return 'Sin fecha';
    
    try {
      const dateObj = date instanceof Date ? date : new Date(date);
      
      // Verificar que la fecha sea válida
      if (isNaN(dateObj.getTime())) {
        return 'Fecha inválida';
      }
      
      return dateObj.toLocaleDateString('es-CO', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      console.error('Error formateando fecha:', error);
      return 'Error en fecha';
    }
  }

  getEstadoBadgeColor(estado: string): string {
    const estadoInfo = this.estadosDisponibles.find(e => e.key === estado);
    return estadoInfo?.color || 'medium';
  }

  getEstadoIcon(estado: string): string {
    const estadoInfo = this.estadosDisponibles.find(e => e.key === estado);
    return estadoInfo?.icon || 'ellipse-outline';
  }

  getEstadoText(estado: string): string {
    const estadoInfo = this.estadosDisponibles.find(e => e.key === estado);
    return estadoInfo?.label || estado;
  }

  getPaymentMethodName(method: string): string {
    const methods: { [key: string]: string } = {
      'paypal': 'PayPal',
      'payu': 'Tarjeta de crédito',
      'efectivo': 'Efectivo',
      'cash': 'Efectivo',
      'bank_transfer': 'Transferencia bancaria'
    };
    return methods[method] || method;
  }

  getContadorPorEstado(estado: string): number {
    return this.pedidos.filter(p => this.getEstadoPedido(p) === estado).length;
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

  trackByPedidoId(index: number, pedido: Pedido): string {
    return pedido?.id ?? index.toString();
  }
}