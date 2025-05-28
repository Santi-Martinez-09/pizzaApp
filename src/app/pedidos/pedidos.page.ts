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
  callOutline,
  restaurantOutline,
  carOutline,
  eyeOutline,
  bugOutline,
  addOutline
} from 'ionicons/icons';
import { AuthService } from '../services/auth.service';
import { PizzaService, Pedido, ItemCarrito } from '../services/pizza/pizza.service';

@Component({
  selector: 'app-pedidos',
  templateUrl: './pedidos.page.html',
  styleUrls: ['./pedidos.page.scss'],
  standalone: true,
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
  debugInfo: any = {};

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
      callOutline,
      restaurantOutline,
      carOutline,
      eyeOutline,
      bugOutline,
      addOutline
    });
  }

  async ngOnInit() {
    console.log('🔍 PEDIDOS PAGE: Iniciando ngOnInit');
    await this.loadPedidos();
  }

  async loadPedidos(event?: any) {
    this.isLoading = true;
    
    try {
      console.log('🔍 LOAD PEDIDOS: Iniciando carga...');
      
      const currentUser = this.authService.getCurrentUser();
      const userProfile = this.authService.getUserProfile();
      
      // ✅ DEBUG DETALLADO DEL USUARIO
      console.log('🔍 USUARIO DEBUG:', {
        firebaseUser: currentUser ? {
          uid: currentUser.uid,
          email: currentUser.email,
          displayName: currentUser.displayName
        } : null,
        userProfile: userProfile ? {
          uid: userProfile.uid,
          email: userProfile.email,
          displayName: userProfile.displayName,
          role: userProfile.role
        } : null,
        isLoggedIn: this.authService.isLoggedIn()
      });
      
      if (currentUser) {
        console.log('🔍 BUSCANDO PEDIDOS para userId:', currentUser.uid);
        
        // Buscar pedidos del usuario
        this.pedidos = await this.pizzaService.getPedidosByUser(currentUser.uid);
        
        console.log('🔍 PEDIDOS ENCONTRADOS:', this.pedidos.length);
        console.log('🔍 PEDIDOS DATA:', this.pedidos);
        
        // Si no hay pedidos, hacer debug adicional
        if (this.pedidos.length === 0) {
          await this.debugNoPedidos(currentUser.uid);
        }
        
        // Actualizar debug info
        this.debugInfo = {
          userId: currentUser.uid,
          userEmail: currentUser.email,
          pedidosEncontrados: this.pedidos.length,
          ultimaActualizacion: new Date().toLocaleTimeString()
        };
        
      } else {
        console.error('❌ Usuario no autenticado');
        this.presentToast('Usuario no autenticado', 'danger');
        this.router.navigate(['/login']);
      }
    } catch (error) {
      console.error('❌ Error cargando pedidos:', error);
      this.presentToast('Error cargando pedidos: ' + error, 'danger');
    } finally {
      this.isLoading = false;
      if (event) {
        event.target.complete();
      }
    }
  }

  // ✅ DEBUG CUANDO NO HAY PEDIDOS
  private async debugNoPedidos(userId: string) {
    try {
      console.log('🔍 DEBUG NO PEDIDOS: Investigando...');
      
      // Obtener TODOS los pedidos para comparar
      const todosPedidos = await this.pizzaService.getAllPedidos();
      console.log('🔍 TOTAL PEDIDOS EN BD:', todosPedidos.length);
      
      if (todosPedidos.length > 0) {
        console.log('🔍 ANÁLISIS DE PEDIDOS:');
        todosPedidos.forEach((pedido, index) => {
          console.log(`  Pedido ${index + 1}:`, {
            id: pedido.id,
            userId: pedido.userId,
            userIdTipo: typeof pedido.userId,
            userIdActualTipo: typeof userId,
            coincide: pedido.userId === userId,
            fecha: pedido.fechaCreacion,
            total: pedido.total,
            estado: pedido.estado
          });
        });
        
        // Filtrar manualmente para ver qué pasa
        const pedidosManual = todosPedidos.filter(p => p.userId === userId);
        console.log('🔍 FILTRO MANUAL RESULT:', pedidosManual.length, 'pedidos');
        
        // Verificar si hay pedidos con userId similar
        const pedidosSimilares = todosPedidos.filter(p => 
          p.userId && p.userId.includes(userId.substring(0, 10))
        );
        console.log('🔍 PEDIDOS CON userId SIMILAR:', pedidosSimilares.length);
        
      } else {
        console.log('🔍 NO HAY PEDIDOS EN LA BASE DE DATOS');
      }
      
    } catch (error) {
      console.error('❌ Error en debug no pedidos:', error);
    }
  }

  // ✅ MÉTODO DE DEBUG COMPLETO
  async debugPedidos() {
    const alert = await this.alertController.create({
      header: '🐛 DEBUG: Información de Pedidos',
      message: 'Iniciando diagnóstico completo...',
      buttons: ['OK']
    });
    await alert.present();

    const currentUser = this.authService.getCurrentUser();
    const userProfile = this.authService.getUserProfile();
    
    console.log('🔍 === DEBUG PEDIDOS COMPLETO ===');
    console.log('Timestamp:', new Date().toISOString());
    
    if (!currentUser) {
      console.log('❌ ERROR: No hay usuario autenticado');
      this.presentToast('No hay usuario autenticado', 'danger');
      return;
    }

    try {
      // 1. INFO DEL USUARIO
      console.log('👤 USUARIO INFO:');
      console.log('  Firebase User:', {
        uid: currentUser.uid,
        email: currentUser.email,
        displayName: currentUser.displayName,
        emailVerified: currentUser.emailVerified
      });
      console.log('  User Profile:', userProfile);
      
      // 2. CONSULTA DIRECTA
      console.log('📊 CONSULTA DIRECTA:');
      const pedidosUsuario = await this.pizzaService.getPedidosByUser(currentUser.uid);
      console.log('  Pedidos del usuario:', pedidosUsuario.length);
      
      // 3. TODOS LOS PEDIDOS
      console.log('📋 TODOS LOS PEDIDOS:');
      const todosPedidos = await this.pizzaService.getAllPedidos();
      console.log('  Total en BD:', todosPedidos.length);
      
      // 4. ANÁLISIS DETALLADO
      if (todosPedidos.length > 0) {
        console.log('🔍 ANÁLISIS DETALLADO:');
        
        const pedidosDelUsuario = todosPedidos.filter(p => p.userId === currentUser.uid);
        console.log('  Filtrados por UID exacto:', pedidosDelUsuario.length);
        
        const pedidosConUserId = todosPedidos.filter(p => p.userId);
        console.log('  Con userId definido:', pedidosConUserId.length);
        
        // Mostrar todos los userIds únicos
        const userIds = [...new Set(todosPedidos.map(p => p.userId).filter(Boolean))];
        console.log('  UserIds únicos encontrados:', userIds);
        console.log('  Mi userId:', currentUser.uid);
        console.log('  Mi userId está en la lista:', userIds.includes(currentUser.uid));
        
        // Mostrar detalles de cada pedido
        todosPedidos.forEach((pedido, index) => {
          console.log(`  Pedido ${index + 1}:`, {
            id: pedido.id?.substring(0, 8) || 'sin-id',
            userId: pedido.userId || 'sin-userId',
            esDelUsuario: pedido.userId === currentUser.uid,
            fecha: pedido.fechaCreacion,
            estado: pedido.estado,
            total: pedido.total,
            items: pedido.items?.length || 0
          });
        });
        
      } else {
        console.log('❌ NO HAY PEDIDOS EN LA BASE DE DATOS');
        this.presentToast('No hay pedidos en la base de datos', 'warning');
      }
      
      // 5. VERIFICAR CONEXIÓN FIRESTORE
      console.log('🔗 VERIFICACIÓN FIRESTORE:');
      try {
        await this.pizzaService.getAllPedidos();
        console.log('  ✅ Conexión a Firestore OK');
      } catch (firestoreError) {
        console.log('  ❌ Error conexión Firestore:', firestoreError);
      }
      
      // 6. RESUMEN
      console.log('📋 RESUMEN:');
      console.log('  Usuario autenticado:', !!currentUser);
      console.log('  UID del usuario:', currentUser.uid);
      console.log('  Pedidos en BD:', todosPedidos.length);
      console.log('  Pedidos del usuario:', pedidosUsuario.length);
      console.log('  Estado del componente:', {
        isLoading: this.isLoading,
        pedidosEnVista: this.pedidos.length
      });
      
      console.log('🔍 === FIN DEBUG ===');
      
      // Mostrar alerta con resumen
      const resumen = await this.alertController.create({
        header: '📊 Resumen del Debug',
        message: `
          <div style="text-align: left;">
            <p><strong>Usuario:</strong> ${currentUser.email}</p>
            <p><strong>UID:</strong> ${currentUser.uid}</p>
            <p><strong>Total pedidos en BD:</strong> ${todosPedidos.length}</p>
            <p><strong>Pedidos del usuario:</strong> ${pedidosUsuario.length}</p>
            <p><strong>Estado carga:</strong> ${this.isLoading ? 'Cargando' : 'Completado'}</p>
            <hr>
            <p style="font-size: 0.9em; color: #666;">
              Revisa la consola (F12) para ver los detalles completos
            </p>
          </div>
        `,
        buttons: ['Cerrar']
      });
      await resumen.present();
      
    } catch (error) {
      console.error('❌ Error en debug completo:', error);
      this.presentToast('Error en debug: ' + error, 'danger');
    }
  }

  // ✅ CREAR PEDIDO DE PRUEBA
  async crearPedidoPrueba() {
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) {
      this.presentToast('No hay usuario autenticado', 'danger');
      return;
    }

    const confirm = await this.alertController.create({
      header: '🧪 Crear Pedido de Prueba',
      message: '¿Quieres crear un pedido de prueba para verificar que funciona el guardado?',
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Crear',
          handler: async () => {
            await this.realizarPedidoPrueba(currentUser.uid);
          }
        }
      ]
    });
    await confirm.present();
  }

  private async realizarPedidoPrueba(userId: string) {
    try {
      console.log('🧪 Creando pedido de prueba para:', userId);

      const pedidoPrueba = {
        userId: userId,
        items: [
          {
            id: 'test-item-1',
            tipo: 'pizza' as const,
            item: {
              id: 'pizza-test',
              nombre: 'Pizza de Prueba',
              descripcion: 'Pedido de prueba para debug',
              precio: 25000,
              ingredientes: ['Queso', 'Tomate'],
              categoria: 'clasica' as const,
              disponible: true,
              tamano: 'mediana' as const
            },
            cantidad: 1,
            precio: 25000
          }
        ],
        total: 30000,
        domicilio: 5000,
        direccion: 'Dirección de prueba',
        telefono: '3001234567',
        estado: 'pendiente' as const,
        fechaCreacion: new Date(),
        metodoPago: 'prueba',
        datosEntrega: {
          nombre: 'Usuario de Prueba',
          telefono: '3001234567',
          direccion: 'Dirección de prueba',
          detalles: 'Pedido creado para debug'
        }
      };

      const pedidoId = await this.pizzaService.crearPedido(pedidoPrueba);
      console.log('✅ Pedido de prueba creado:', pedidoId);
      
      this.presentToast('Pedido de prueba creado: ' + pedidoId, 'success');
      
      // Recargar pedidos
      setTimeout(() => {
        this.loadPedidos();
      }, 1000);

    } catch (error) {
      console.error('❌ Error creando pedido de prueba:', error);
      this.presentToast('Error creando pedido de prueba: ' + error, 'danger');
    }
  }

  formatPrice(price: number): string {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(price);
  }

  formatDate(date: Date | any): string {
    if (!date) return 'Sin fecha';
    
    try {
      const dateObj = date instanceof Date ? date : 
                     date.toDate ? date.toDate() : 
                     new Date(date);
      
      if (isNaN(dateObj.getTime())) return 'Fecha inválida';
      
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
          <p><strong>Subtotal:</strong> ${this.formatPrice(pedido.total - pedido.domicilio)}</p>
          <p><strong>Domicilio:</strong> ${this.formatPrice(pedido.domicilio)}</p>
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
      'efectivo': 'Efectivo',
      'cash': 'Efectivo',
      'bank_transfer': 'Transferencia bancaria',
      'prueba': '🧪 Pedido de Prueba'
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
  hasDebugInfo(): boolean {
    return this.debugInfo && Object.keys(this.debugInfo).length > 0;
  }
}