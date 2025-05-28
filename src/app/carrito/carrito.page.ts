import { Component, OnInit, OnDestroy } from '@angular/core';
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
  IonNote,
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
  receiptOutline,
  basketOutline,
  informationCircleOutline
} from 'ionicons/icons';
import { PizzaService, ItemCarrito } from '../services/pizza/pizza.service';
import { Subscription } from 'rxjs';

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
    IonNote
  ]
})
export class CarritoPage implements OnInit, OnDestroy {
  carrito: ItemCarrito[] = [];
  subtotal: number = 0;
  domicilio: number = 5000; // Estimado inicial
  total: number = 0;
  private carritoSubscription: Subscription | null = null;
  
  constructor(
    private pizzaService: PizzaService,
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
      cardOutline,
      basketOutline,
      informationCircleOutline
    });
  }

  async ngOnInit() {
    console.log('🛒 CarritoPage: Iniciando...');
    
    // Suscripción al carrito
    this.carritoSubscription = this.pizzaService.carrito$.subscribe(carrito => {
      console.log('🛒 Carrito actualizado:', carrito.length, 'items');
      this.carrito = [...carrito];
      this.calcularTotales();
    });

    // Cargar carrito inicial
    this.carrito = this.pizzaService.getCarrito();
    this.calcularTotales();
    
    console.log('🛒 Carrito inicial:', this.carrito.length, 'items');
  }

  ngOnDestroy() {
    console.log('🛒 Destruyendo componente');
    if (this.carritoSubscription) {
      this.carritoSubscription.unsubscribe();
    }
  }

  // Calcular totales
  calcularTotales() {
    this.subtotal = this.carrito.reduce((total, item) => 
      total + (item.precio * item.cantidad), 0
    );
    this.total = this.subtotal + (this.carrito.length > 0 ? this.domicilio : 0);
  }

  // Formatear precio
  formatPrice(price: number): string {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(price);
  }

  // Aumentar cantidad
  aumentarCantidad(item: ItemCarrito) {
    this.pizzaService.actualizarCantidad(item.id, item.cantidad + 1);
  }

  // Disminuir cantidad
  disminuirCantidad(item: ItemCarrito) {
    if (item.cantidad > 1) {
      this.pizzaService.actualizarCantidad(item.id, item.cantidad - 1);
    } else {
      this.removerItem(item);
    }
  }

  // Remover item con confirmación
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

  // Limpiar carrito completo
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

  // Continuar comprando
  continuarComprando() {
    this.router.navigate(['/home']);
  }

  // **MÉTODO PRINCIPAL** - Proceder al pago
  procederAlPago() {
    if (this.carrito.length === 0) {
      this.presentToast('El carrito está vacío', 'warning');
      return;
    }

    console.log('🛒 Procediendo al pago con', this.carrito.length, 'items');
    this.router.navigate(['/pago']);
  }

  // Obtener imagen del item
  getItemImage(item: ItemCarrito): string {
    return item.tipo === 'pizza' 
      ? item.item.imagen || 'assets/images/pizza-default.jpg'
      : item.item.imagen || 'assets/images/bebida-default.jpg';
  }

  // Obtener descripción del item
  getItemDescription(item: ItemCarrito): string {
    return item.tipo === 'pizza' 
      ? (item.item as any).descripcion || ''
      : `Tamaño: ${(item.item as any).tamano || ''}`;
  }

  // Verificar si tiene items
  tieneItems(): boolean {
    return this.carrito.length > 0;
  }

  // Track function para optimizar ngFor
  trackByItemId(index: number, item: ItemCarrito): string {
    return item.id;
  }

  // Mostrar toast
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
}