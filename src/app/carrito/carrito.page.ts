import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
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
  receiptOutline,
  bagOutline
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
export class CarritoPage implements OnInit, OnDestroy {
  carrito: ItemCarrito[] = [];
  subtotal: number = 0;
  domicilio: number = 5000; // Costo fijo de domicilio
  total: number = 0;
  private carritoSubscription?: Subscription;
  
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
      cardOutline,
      bagOutline
    });
  }

  ngOnInit() {
    console.log('CarritoPage: Iniciando componente');
    
    // Suscripción al carrito
    this.carritoSubscription = this.pizzaService.carrito$.subscribe(carrito => {
      console.log('CarritoPage: Carrito actualizado', carrito);
      this.carrito = carrito;
      this.calcularTotales();
    });
  }

  ngOnDestroy() {
    if (this.carritoSubscription) {
      this.carritoSubscription.unsubscribe();
    }
  }

  calcularTotales() {
    this.subtotal = this.carrito.reduce((total, item) => 
      total + (item.precio * item.cantidad), 0
    );
    this.total = this.subtotal + (this.carrito.length > 0 ? this.domicilio : 0);
    
    console.log('CarritoPage: Totales calculados', {
      subtotal: this.subtotal,
      domicilio: this.domicilio,
      total: this.total
    });
  }

  formatPrice(price: number): string {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(price);
  }

  aumentarCantidad(item: ItemCarrito) {
    console.log('CarritoPage: Aumentando cantidad', item);
    this.pizzaService.actualizarCantidad(item.id, item.cantidad + 1);
  }

  disminuirCantidad(item: ItemCarrito) {
    console.log('CarritoPage: Disminuyendo cantidad', item);
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
            console.log('CarritoPage: Removiendo item', item);
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
      message: '¿Deseas remover todos los items del carrito?',
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Limpiar',
          handler: () => {
            console.log('CarritoPage: Limpiando carrito');
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
    
    console.log('CarritoPage: Procediendo al pago', {
      carrito: this.carrito,
      total: this.total
    });
    
    // Aquí podrías pasar los datos del carrito a la página de pago
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
    console.log('CarritoPage: Continuando compras');
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
    // Imagen por defecto según el tipo
    const defaultImage = item.tipo === 'pizza' 
      ? 'assets/images/pizza-default.jpg' 
      : 'assets/images/bebida-default.jpg';
    
    return item.item.imagen || defaultImage;
  }

  getItemDescription(item: ItemCarrito): string {
    if (item.tipo === 'pizza') {
      const pizza = item.item as any;
      return pizza.descripcion || `Pizza ${pizza.tamano || 'mediana'}`;
    } else {
      const bebida = item.item as any;
      return `Tamaño: ${bebida.tamano || ''}`;
    }
  }

  // Método para debugging - puedes removerlo en producción
  debugCarrito() {
    console.log('Estado actual del carrito:', {
      items: this.carrito,
      subtotal: this.subtotal,
      domicilio: this.domicilio,
      total: this.total
    });
  }

  // TrackBy function para mejor rendimiento en ngFor
  trackByItemId(index: number, item: ItemCarrito): string {
    return item.id;
  }

  // Manejo de errores de imagen
  onImageError(event: any) {
    console.log('Error cargando imagen, usando imagen por defecto');
    event.target.src = 'assets/images/default-product.jpg';
  }
}