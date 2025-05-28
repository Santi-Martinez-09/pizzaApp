import { Component, OnInit, AfterViewInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import {
  IonContent,
  IonHeader,
  IonTitle,
  IonToolbar,
  IonButtons,
  IonBackButton,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonItem,
  IonLabel,
  IonInput,
  IonTextarea,
  IonButton,
  IonIcon,
  IonRadioGroup,
  IonRadio,
  IonSpinner,
  IonNote,
  AlertController,
  ToastController,
  LoadingController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  receiptOutline,
  personOutline,
  locationOutline,
  mapOutline,
  timeOutline,
  navigateOutline,
  cashOutline,
  cardOutline,
  checkmarkCircleOutline
} from 'ionicons/icons';
import { environment } from '../../environments/environment';


import { PizzaService, ItemCarrito } from '../services/pizza/pizza.service';
import { AuthService } from '../services/auth.service';
import { PayPalLoaderService } from '../services/paypal.service';

// Declaraciones para APIs externas
declare var google: any;
declare var paypal: any;

interface DatosEntrega {
  nombre: string;
  telefono: string;
  direccion: string;
  detalles: string;
}

interface DistanciaInfo {
  distancia: string;
  duracion: string;
  distanciaMetros: number;
  duracionMinutos: number;
}

@Component({
  selector: 'app-pago',
  templateUrl: './pago.page.html',
  styleUrls: ['./pago.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonContent,
    IonHeader,
    IonTitle,
    IonToolbar,
    IonButtons,
    IonBackButton,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonItem,
    IonLabel,
    IonInput,
    IonTextarea,
    IonButton,
    IonIcon,
    IonRadioGroup,
    IonRadio,
    IonSpinner,
    IonNote
  ]
})
export class PagoPage implements OnInit, AfterViewInit, OnDestroy {
  // Datos del carrito
  carrito: ItemCarrito[] = [];
  subtotal: number = 0;
  domicilio: number = 5000;
  domicilioCalculado: number = 5000;
  total: number = 0;

  // Datos del formulario
  datosEntrega: DatosEntrega = {
    nombre: '',
    telefono: '',
    direccion: '',
    detalles: ''
  };

  // Estado de cálculo de distancia
  calculandoDistancia = false;
  distanciaInfo: DistanciaInfo | undefined = undefined;
  mostrarMapa = false;

  // Coordenadas Universidad Libre Bogotá
  private readonly UNIVERSIDAD_LIBRE = {
    lat: 4.6280469,
    lng: -74.0842873,
    nombre: 'Universidad Libre - Sede Bogotá'
  };

  // Método de pago
  metodoPagoSeleccionado: 'paypal' | 'efectivo' = 'paypal';

  // Estados de PayPal
  paypalStatus: 'loading' | 'ready' | 'error' = 'loading';
  paypalError = '';
  private map: any;
  private geocoder: any;
  private directionsService: any;
  private directionsRenderer: any;

  // Estados generales
  procesandoPedido = false;

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
      receiptOutline,
      personOutline,
      locationOutline,
      mapOutline,
      timeOutline,
      navigateOutline,
      cashOutline,
      cardOutline,
      checkmarkCircleOutline
    });
  }

  async ngOnInit() {
    console.log('🛒 PagoPage: Iniciando...');
    
    // Obtener datos del carrito
    this.carrito = this.pizzaService.getCarrito();
    
    if (this.carrito.length === 0) {
      this.presentToast('El carrito está vacío', 'warning');
      this.router.navigate(['/home']);
      return;
    }

    this.calcularTotales();
    
    // Cargar datos del usuario si están disponibles
    this.cargarDatosUsuario();
    
    console.log('🛒 Carrito cargado:', this.carrito.length, 'items, total:', this.total);
  }

  async ngAfterViewInit() {
    // Cargar Google Maps API
    await this.loadGoogleMapsAPI();
  }

  ngOnDestroy() {
    // Limpiar recursos si es necesario
    if (this.map) {
      this.map = null;
    }
  }

  private calcularTotales() {
    this.subtotal = this.carrito.reduce((total, item) => 
      total + (item.precio * item.cantidad), 0
    );
    this.total = this.subtotal + this.domicilioCalculado;
  }

  private cargarDatosUsuario() {
    const userProfile = this.authService.getUserProfile();
    if (userProfile) {
      this.datosEntrega.nombre = userProfile.displayName || '';
    }
  }

  // Cargar Google Maps API dinámicamente
  private async loadGoogleMapsAPI(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (typeof google !== 'undefined' && google.maps) {
        this.initializeGoogleMapsServices();
        resolve();
        return;
      }

      const script = document.createElement('script');
      // En el método loadGoogleMapsAPI():
script.src = `https://maps.googleapis.com/maps/api/js?key=${environment.googleMapsApiKey}&libraries=geometry,places`;
      script.async = true;
      script.defer = true;

      script.onload = () => {
        this.initializeGoogleMapsServices();
        console.log('✅ Google Maps API cargada');
        resolve();
      };

      script.onerror = (error) => {
        console.error('❌ Error cargando Google Maps API:', error);
        reject(error);
      };

      document.head.appendChild(script);
    });
  }

  private initializeGoogleMapsServices() {
    this.geocoder = new google.maps.Geocoder();
    this.directionsService = new google.maps.DirectionsService();
    this.directionsRenderer = new google.maps.DirectionsRenderer();
  }

  // Calcular distancia usando Google Maps API
  async calcularDistancia() {
    if (!this.datosEntrega.direccion.trim()) {
      this.presentToast('Por favor ingresa una dirección', 'warning');
      return;
    }

    this.calculandoDistancia = true;
    
    try {
      console.log('📍 Calculando distancia desde:', this.datosEntrega.direccion);
      
      // Geocodificar la dirección del usuario
      const userLocation = await this.geocodeAddress(this.datosEntrega.direccion);
      
      if (!userLocation) {
        throw new Error('No se pudo encontrar la dirección especificada');
      }

      // Calcular distancia y tiempo
      const distanceResult = await this.calculateDistanceMatrix(
        userLocation,
        this.UNIVERSIDAD_LIBRE
      );

      // Actualizar información
      this.distanciaInfo = distanceResult;
      this.domicilioCalculado = this.calcularCostoDomicilio(distanceResult.distanciaMetros);
      this.calcularTotales();

      // Mostrar mapa
      this.mostrarMapa = true;
      
      // Esperar un momento para que el DOM se actualice
      setTimeout(async () => {
        await this.initializeMap(userLocation);
      }, 200);

      // Inicializar PayPal si está seleccionado
      if (this.metodoPagoSeleccionado === 'paypal') {
        setTimeout(() => {
          this.initializePayPal();
        }, 1000);
      }

      this.presentToast('✅ Distancia calculada correctamente', 'success');
      
    } catch (error) {
  console.error('❌ Error calculando distancia:', error);
  this.presentToast(`Error: ${error}`, 'danger');
  this.distanciaInfo = undefined;  // ← Cambiar null por undefined
  this.mostrarMapa = false;
} finally {
  this.calculandoDistancia = false;
}
  }

  // Geocodificar dirección
  private geocodeAddress(address: string): Promise<{lat: number, lng: number} | null> {
    return new Promise((resolve, reject) => {
      this.geocoder.geocode(
        { 
          address: address + ', Bogotá, Colombia',
          region: 'CO'
        },
        (results: any[], status: string) => {
          if (status === 'OK' && results.length > 0) {
            const location = results[0].geometry.location;
            resolve({
              lat: location.lat(),
              lng: location.lng()
            });
          } else {
            console.error('Geocoding failed:', status);
            reject('No se pudo encontrar la dirección');
          }
        }
      );
    });
  }

  // Calcular matriz de distancias
  private calculateDistanceMatrix(origin: {lat: number, lng: number}, destination: {lat: number, lng: number}): Promise<DistanciaInfo> {
    return new Promise((resolve, reject) => {
      const service = new google.maps.DistanceMatrixService();
      
      service.getDistanceMatrix({
        origins: [new google.maps.LatLng(origin.lat, origin.lng)],
        destinations: [new google.maps.LatLng(destination.lat, destination.lng)],
        travelMode: google.maps.TravelMode.DRIVING,
        unitSystem: google.maps.UnitSystem.METRIC,
        avoidHighways: false,
        avoidTolls: false
      }, (response: any, status: string) => {
        if (status === 'OK') {
          const element = response.rows[0].elements[0];
          
          if (element.status === 'OK') {
            resolve({
              distancia: element.distance.text,
              duracion: element.duration.text,
              distanciaMetros: element.distance.value,
              duracionMinutos: Math.ceil(element.duration.value / 60)
            });
          } else {
            reject('No se pudo calcular la ruta');
          }
        } else {
          reject('Error en el servicio de distancias');
        }
      });
    });
  }

  // Calcular costo de domicilio basado en distancia
  private calcularCostoDomicilio(distanciaMetros: number): number {
    const distanciaKm = distanciaMetros / 1000;
    
    // Tarifas escalonadas
    if (distanciaKm <= 5) return 5000;      // Hasta 5km: $5.000
    if (distanciaKm <= 10) return 7000;     // 5-10km: $7.000
    if (distanciaKm <= 15) return 10000;    // 10-15km: $10.000
    if (distanciaKm <= 20) return 13000;    // 15-20km: $13.000
    
    return 15000; // Más de 20km: $15.000
  }

  // Inicializar mapa
  private async initializeMap(userLocation: {lat: number, lng: number}) {
    const mapContainer = document.getElementById('map');
    if (!mapContainer) {
      console.error('❌ Contenedor del mapa no encontrado');
      return;
    }

    console.log('🗺️ Inicializando mapa...');

    // Esperar un momento para que el DOM se actualice
    await new Promise(resolve => setTimeout(resolve, 100));

    // Configuración del mapa
    const mapOptions = {
      zoom: 12,
      center: userLocation,
      mapTypeId: google.maps.MapTypeId.ROADMAP,
      styles: [
        {
          featureType: 'poi',
          elementType: 'labels',
          stylers: [{ visibility: 'off' }]
        }
      ],
      // Opciones adicionales para asegurar renderizado
      gestureHandling: 'cooperative',
      zoomControl: true,
      mapTypeControl: false,
      scaleControl: true,
      streetViewControl: false,
      rotateControl: false,
      fullscreenControl: false
    };

    // Crear mapa
    this.map = new google.maps.Map(mapContainer, mapOptions);

    // Esperar a que el mapa termine de cargar
    google.maps.event.addListenerOnce(this.map, 'tilesloaded', () => {
      console.log('✅ Mapa cargado completamente');
    });

    // Forzar resize del mapa después de un momento
    setTimeout(() => {
      if (this.map) {
        google.maps.event.trigger(this.map, 'resize');
        this.map.setCenter(userLocation);
      }
    }, 500);

    // Marcador de la dirección del usuario
    const userMarker = new google.maps.Marker({
      position: userLocation,
      map: this.map,
      title: 'Tu dirección de entrega',
      icon: {
        url: 'https://maps.google.com/mapfiles/ms/icons/red-dot.png',
        scaledSize: new google.maps.Size(40, 40)
      },
      animation: google.maps.Animation.DROP
    });

    // Marcador de Universidad Libre
    const universityMarker = new google.maps.Marker({
      position: this.UNIVERSIDAD_LIBRE,
      map: this.map,
      title: this.UNIVERSIDAD_LIBRE.nombre,
      icon: {
        url: 'https://maps.google.com/mapfiles/ms/icons/blue-dot.png',
        scaledSize: new google.maps.Size(40, 40)
      },
      animation: google.maps.Animation.DROP
    });

    // Configurar renderer de direcciones
    this.directionsRenderer.setMap(this.map);
    this.directionsRenderer.setOptions({
      suppressMarkers: false,
      polylineOptions: {
        strokeColor: '#4285f4',
        strokeWeight: 5,
        strokeOpacity: 0.8
      }
    });
    
    // Dibujar ruta
    this.directionsService.route({
      origin: userLocation,
      destination: this.UNIVERSIDAD_LIBRE,
      travelMode: google.maps.TravelMode.DRIVING,
      avoidHighways: false,
      avoidTolls: false
    }, (result: any, status: string) => {
      if (status === 'OK') {
        this.directionsRenderer.setDirections(result);
        console.log('✅ Ruta dibujada correctamente');
      } else {
        console.error('❌ Error dibujando ruta:', status);
      }
    });

    // Ajustar vista para mostrar ambos puntos
    const bounds = new google.maps.LatLngBounds();
    bounds.extend(userLocation);
    bounds.extend(this.UNIVERSIDAD_LIBRE);
    this.map.fitBounds(bounds);

    // Asegurar zoom mín/máx
    setTimeout(() => {
      if (this.map && this.map.getZoom() > 15) {
        this.map.setZoom(15);
      }
    }, 1000);

    console.log('🗺️ Mapa inicializado completamente');
  }

  // Inicializar PayPal
  async initializePayPal() {
    this.paypalStatus = 'loading';
    this.paypalError = '';
    
    try {
      const loaded = await this.paypalLoader.loadSDK();
      
      if (!loaded) {
        throw new Error('No se pudo cargar PayPal SDK');
      }

      await this.renderPayPalButton();
      this.paypalStatus = 'ready';
      
    } catch (error) {
      console.error('❌ Error inicializando PayPal:', error);
      this.paypalStatus = 'error';
      this.paypalError = `${error}`;
    }
  }

  // Renderizar botón de PayPal
  private async renderPayPalButton() {
    const paypal = this.paypalLoader.getPayPal();
    const container = document.getElementById('paypal-payment-button');
    
    if (!container) {
      throw new Error('Contenedor PayPal no encontrado');
    }

    // Limpiar contenedor
    container.innerHTML = '';
    
    const totalUSD = ((this.subtotal + this.domicilioCalculado) / 4000).toFixed(2);

    await paypal.Buttons({
      style: {
        layout: 'vertical',
        color: 'gold',
        shape: 'rect',
        label: 'paypal',
        height: 45
      },

      createOrder: (data: any, actions: any) => {
        return actions.order.create({
          purchase_units: [{
            amount: {
              value: totalUSD,
              currency_code: 'USD'
            },
            description: `PizzaApp - Entrega a ${this.datosEntrega.direccion}`,
            custom_id: `order_${Date.now()}`
          }],
          application_context: {
            brand_name: 'PizzaApp',
            locale: 'es-ES',
            landing_page: 'BILLING',
            shipping_preference: 'NO_SHIPPING',
            user_action: 'PAY_NOW'
          }
        });
      },

      onApprove: async (data: any, actions: any) => {
        try {
          const details = await actions.order.capture();
          await this.procesarPedidoPayPal(details);
        } catch (error) {
          console.error('❌ Error capturando pago:', error);
          this.presentToast('Error procesando el pago', 'danger');
        }
      },

      onError: (err: any) => {
        console.error('❌ Error PayPal:', err);
        this.presentToast('Error con PayPal. Intenta de nuevo.', 'danger');
      },

      onCancel: () => {
        this.presentToast('Pago cancelado', 'warning');
      }

    }).render('#paypal-payment-button');
  }

  // Procesar pedido con PayPal
  async procesarPedidoPayPal(details: any) {
    this.procesandoPedido = true;
    
    try {
      const currentUser = this.authService.getCurrentUser();
      if (!currentUser) {
        throw new Error('Usuario no autenticado');
      }

      const pedidoData = {
        userId: currentUser.uid,
        items: [...this.carrito],
        total: this.subtotal + this.domicilioCalculado,
        domicilio: this.domicilioCalculado,
        direccion: this.datosEntrega.direccion,
        telefono: this.datosEntrega.telefono,
        estado: 'pendiente' as const,
        fechaCreacion: new Date(),
        metodoPago: 'paypal',
        paypalTransactionId: details.id,
        datosEntrega: this.datosEntrega,
        distanciaInfo: this.distanciaInfo
      };

      const pedidoId = await this.pizzaService.crearPedido(pedidoData);
      
      await this.mostrarExitoPedido(pedidoId, details);
      
    } catch (error) {
      console.error('❌ Error creando pedido:', error);
      this.presentToast('Error procesando pedido', 'danger');
    } finally {
      this.procesandoPedido = false;
    }
  }

  // Procesar pedido en efectivo
  async procesarPedidoEfectivo() {
    if (!this.validarFormulario()) {
      return;
    }

    this.procesandoPedido = true;
    
    try {
      const currentUser = this.authService.getCurrentUser();
      if (!currentUser) {
        throw new Error('Usuario no autenticado');
      }

      const pedidoData = {
        userId: currentUser.uid,
        items: [...this.carrito],
        total: this.subtotal + this.domicilioCalculado,
        domicilio: this.domicilioCalculado,
        direccion: this.datosEntrega.direccion,
        telefono: this.datosEntrega.telefono,
        estado: 'pendiente' as const,
        fechaCreacion: new Date(),
        metodoPago: 'efectivo',
        datosEntrega: this.datosEntrega,
        distanciaInfo: this.distanciaInfo
      };

      const pedidoId = await this.pizzaService.crearPedido(pedidoData);
      
      await this.mostrarExitoPedidoEfectivo(pedidoId);
      
    } catch (error) {
      console.error('❌ Error creando pedido:', error);
      this.presentToast('Error procesando pedido', 'danger');
    } finally {
      this.procesandoPedido = false;
    }
  }

  // Validar formulario
  private validarFormulario(): boolean {
    if (!this.datosEntrega.nombre.trim()) {
      this.presentToast('El nombre es requerido', 'warning');
      return false;
    }
    
    if (!this.datosEntrega.telefono.trim()) {
      this.presentToast('El teléfono es requerido', 'warning');
      return false;
    }
    
    if (!this.datosEntrega.direccion.trim()) {
      this.presentToast('La dirección es requerida', 'warning');
      return false;
    }
    
    if (!this.distanciaInfo) {
      this.presentToast('Primero calcula la distancia', 'warning');
      return false;
    }
    
    return true;
  }

  // Mostrar éxito del pedido (PayPal)
  async mostrarExitoPedido(pedidoId: string, details: any) {
    const alert = await this.alertController.create({
      header: '🎉 ¡Pedido Confirmado!',
      message: `
        <div style="text-align: left; line-height: 1.6;">
          <p><strong>¡Gracias ${this.datosEntrega.nombre}!</strong></p>
          <p>Tu pedido ha sido procesado correctamente.</p>
          <hr>
          <p><strong>📦 Pedido:</strong> #${pedidoId.substring(0, 8).toUpperCase()}</p>
          <p><strong>💰 Total:</strong> ${this.formatPrice(this.subtotal + this.domicilioCalculado)}</p>
          <p><strong>📍 Dirección:</strong> ${this.datosEntrega.direccion}</p>
          <p><strong>⏰ Tiempo estimado:</strong> ${this.distanciaInfo?.duracion}</p>
          <hr>
          <p>🍕 Tu pedido será preparado y enviado pronto</p>
        </div>
      `,
      buttons: [
        {
          text: '📋 Mis Pedidos',
          handler: () => this.router.navigate(['/pedidos'])
        }
      ],
      backdropDismiss: false
    });

    await alert.present();
  }

  // Mostrar éxito del pedido (Efectivo)
  async mostrarExitoPedidoEfectivo(pedidoId: string) {
    const alert = await this.alertController.create({
      header: '🎉 ¡Pedido Confirmado!',
      message: `
        <div style="text-align: left; line-height: 1.6;">
          <p><strong>¡Gracias ${this.datosEntrega.nombre}!</strong></p>
          <p>Tu pedido ha sido confirmado para pago en efectivo.</p>
          <hr>
          <p><strong>📦 Pedido:</strong> #${pedidoId.substring(0, 8).toUpperCase()}</p>
          <p><strong>💰 Total a pagar:</strong> ${this.formatPrice(this.subtotal + this.domicilioCalculado)}</p>
          <p><strong>📍 Dirección:</strong> ${this.datosEntrega.direccion}</p>
          <p><strong>📞 Teléfono:</strong> ${this.datosEntrega.telefono}</p>
          <p><strong>⏰ Tiempo estimado:</strong> ${this.distanciaInfo?.duracion}</p>
          <hr>
          <p>💵 Ten listo el dinero exacto al momento de la entrega</p>
          <p>🍕 ¡Tu pedido será preparado y enviado pronto!</p>
        </div>
      `,
      buttons: [
        {
          text: '📋 Ver Mis Pedidos',
          handler: () => this.router.navigate(['/pedidos'])
        }
      ],
      backdropDismiss: false
    });

    await alert.present();
  }

  // Formatear precio
  formatPrice(price: number): string {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(price);
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

  // Debug del estado del mapa
  private debugMapState() {
    console.log('🔍 === DEBUG MAPA ===');
    console.log('Maps API disponible:', typeof google !== 'undefined' && google.maps);
    console.log('Contenedor mapa existe:', !!document.getElementById('map'));
    console.log('Instancia de mapa:', !!this.map);
    console.log('Distancia info:', this.distanciaInfo);
    console.log('Mostrar mapa:', this.mostrarMapa);
    
    const container = document.getElementById('map');
    if (container) {
      console.log('Dimensiones contenedor:', {
        width: container.offsetWidth,
        height: container.offsetHeight,
        display: window.getComputedStyle(container).display
      });
    }
  }

  // Forzar renderizado del mapa (método para debug)
  forceMapRender() {
    console.log('🔄 Forzando renderizado del mapa...');
    this.debugMapState();
    
    if (this.map) {
      setTimeout(() => {
        google.maps.event.trigger(this.map, 'resize');
        if (this.distanciaInfo) {
          // Re-centrar en la ubicación del usuario si existe
          const bounds = new google.maps.LatLngBounds();
          bounds.extend(this.UNIVERSIDAD_LIBRE);
          this.map.fitBounds(bounds);
        }
      }, 100);
    }
  }
}