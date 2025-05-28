import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { EditPizzaModalComponent, EditBebidaModalComponent } from '../components/editProduct/edit-product-modals.component';
// Agregar estas líneas al inicio del archivo (después de las importaciones existentes)
import { AddPizzaModalComponent, AddBebidaModalComponent } from '../components/agregarProducto/add-product-modals.component';
import { ReactiveFormsModule, FormBuilder } from '@angular/forms';
import { ModalController, ActionSheetController } from '@ionic/angular/standalone';
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
  IonFab,
  IonFabButton,
  IonGrid,
  IonRow,
  IonCol,
  IonSearchbar,
  IonSegment,
  IonSegmentButton,
  IonRefresher,
  IonRefresherContent,
  IonSpinner,
  AlertController,
  ToastController,
  LoadingController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  addOutline,
  createOutline,
  trashOutline,
  eyeOutline,
  searchOutline,
  filterOutline,
  statsChartOutline,
  storefrontOutline,
  pizzaOutline,
  refreshOutline
} from 'ionicons/icons';
import { AuthService } from '../services/auth.service';
import { PizzaService, Pizza, Bebida } from '../services/pizza/pizza.service';

@Component({
  selector: 'app-admin-productos',
  templateUrl: './admin-productos.page.html',
  styleUrls: ['./admin-productos.page.scss'],
  standalone: true,
  imports: [
    ReactiveFormsModule ,
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
    IonFab,
    IonFabButton,
    IonGrid,
    IonRow,
    IonCol,
    IonSearchbar,
    IonSegment,
    IonSegmentButton,
    IonRefresher,
    IonRefresherContent,
    IonSpinner,
    CommonModule,
    FormsModule
  ]
})
export class AdminProductosPage implements OnInit {
  pizzas: Pizza[] = [];
  bebidas: Bebida[] = [];
  filteredPizzas: Pizza[] = [];
  filteredBebidas: Bebida[] = [];
  
  selectedSegment: 'pizzas' | 'bebidas' | 'estadisticas' = 'pizzas';
  searchTerm: string = '';
  isLoading: boolean = false;
  
  // Estadísticas
  stats = {
    totalPizzas: 0,
    totalBebidas: 0,
    pizzasDisponibles: 0,
    bebidasDisponibles: 0,
    precioPromedioPizza: 0,
    precioPromedioBebida: 0
  };

  constructor(
  private authService: AuthService,
  private pizzaService: PizzaService,
  private alertController: AlertController,
  private toastController: ToastController,
  private loadingController: LoadingController,
  private modalController: ModalController, // ← AGREGAR
  private actionSheetController: ActionSheetController, // ← AGREGAR  
  private formBuilder: FormBuilder // ← AGREGAR
) {
    addIcons({
      addOutline,
      createOutline,
      trashOutline,
      eyeOutline,
      searchOutline,
      filterOutline,
      statsChartOutline,
      storefrontOutline,
      pizzaOutline,
      refreshOutline
    });
  }

  async ngOnInit() {
    console.log('🛠️ AdminProductosPage: Inicializando...');
    
    // Verificar permisos de administrador
    if (!this.authService.isAdmin()) {
      console.error('❌ Acceso denegado - no es administrador');
      this.presentToast('Acceso denegado', 'danger');
      return;
    }
    
    await this.loadData();
  }

  async loadData() {
    this.isLoading = true;
    
    try {
      console.log('🛠️ Cargando datos de productos...');
      
      // Cargar pizzas y bebidas en paralelo
      const [pizzasData, bebidasData] = await Promise.all([
        this.pizzaService.getPizzas(),
        this.pizzaService.getBebidas()
      ]);
      
      this.pizzas = pizzasData;
      this.bebidas = bebidasData;
      
      // Aplicar filtros iniciales
      this.applyFilters();
      
      // Calcular estadísticas
      this.calculateStats();
      
      console.log('✅ Datos cargados:', {
        pizzas: this.pizzas.length,
        bebidas: this.bebidas.length
      });
      
    } catch (error) {
      console.error('❌ Error cargando datos:', error);
      this.presentToast('Error cargando productos', 'danger');
    } finally {
      this.isLoading = false;
    }
  }

  async refreshData(event: any) {
    console.log('🔄 Refrescando datos...');
    await this.loadData();
    event.target.complete();
    this.presentToast('Datos actualizados', 'success');
  }

  onSegmentChange(event: any) {
    this.selectedSegment = event.detail.value;
    console.log('🛠️ Segmento cambiado a:', this.selectedSegment);
  }

  onSearchChange(event: any) {
    this.searchTerm = event.detail.value.toLowerCase();
    this.applyFilters();
  }

  applyFilters() {
    // Filtrar pizzas
    this.filteredPizzas = this.pizzas.filter(pizza =>
      pizza.nombre.toLowerCase().includes(this.searchTerm) ||
      pizza.descripcion.toLowerCase().includes(this.searchTerm) ||
      pizza.categoria.toLowerCase().includes(this.searchTerm)
    );

    // Filtrar bebidas
    this.filteredBebidas = this.bebidas.filter(bebida =>
      bebida.nombre.toLowerCase().includes(this.searchTerm) ||
      bebida.tamano.toLowerCase().includes(this.searchTerm)
    );
  }

  calculateStats() {
    this.stats = {
      totalPizzas: this.pizzas.length,
      totalBebidas: this.bebidas.length,
      pizzasDisponibles: this.pizzas.filter(p => p.disponible).length,
      bebidasDisponibles: this.bebidas.filter(b => b.disponible).length,
      precioPromedioPizza: this.pizzas.length > 0 ? 
        this.pizzas.reduce((sum, p) => sum + p.precio, 0) / this.pizzas.length : 0,
      precioPromedioBebida: this.bebidas.length > 0 ?
        this.bebidas.reduce((sum, b) => sum + b.precio, 0) / this.bebidas.length : 0
    };
  }

  async toggleProductAvailability(product: Pizza | Bebida, type: 'pizza' | 'bebida') {
    const loading = await this.loadingController.create({
      message: 'Actualizando disponibilidad...',
      spinner: 'crescent'
    });
    await loading.present();

    try {
      const newStatus = !product.disponible;
      
      if (type === 'pizza') {
        await this.pizzaService.updatePizza(product.id!, { disponible: newStatus });
        const pizzaIndex = this.pizzas.findIndex(p => p.id === product.id);
        if (pizzaIndex !== -1) {
          this.pizzas[pizzaIndex].disponible = newStatus;
        }
      } else {
        // Implementar updateBebida cuando esté disponible
        console.log('Actualizar bebida pendiente de implementar');
      }
      
      this.applyFilters();
      this.calculateStats();
      
      await loading.dismiss();
      this.presentToast(
        `${product.nombre} ${newStatus ? 'activado' : 'desactivado'}`,
        'success'
      );
      
    } catch (error) {
      await loading.dismiss();
      console.error('Error actualizando disponibilidad:', error);
      this.presentToast('Error actualizando producto', 'danger');
    }
  }

  async deleteProduct(product: Pizza | Bebida, type: 'pizza' | 'bebida') {
    const alert = await this.alertController.create({
      header: '⚠️ Eliminar producto',
      message: `¿Estás seguro de que deseas eliminar "${product.nombre}"? Esta acción no se puede deshacer.`,
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Eliminar',
          role: 'destructive',
          handler: async () => {
            await this.performDelete(product, type);
          }
        }
      ]
    });

    await alert.present();
  }

  async performDelete(product: Pizza | Bebida, type: 'pizza' | 'bebida') {
    const loading = await this.loadingController.create({
      message: 'Eliminando producto...',
      spinner: 'crescent'
    });
    await loading.present();

    try {
      if (type === 'pizza') {
        await this.pizzaService.deletePizza(product.id!);
        this.pizzas = this.pizzas.filter(p => p.id !== product.id);
      } else {
        // Implementar deleteBebida cuando esté disponible
        console.log('Eliminar bebida pendiente de implementar');
      }
      
      this.applyFilters();
      this.calculateStats();
      
      await loading.dismiss();
      this.presentToast(`${product.nombre} eliminado`, 'success');
      
    } catch (error) {
      await loading.dismiss();
      console.error('Error eliminando producto:', error);
      this.presentToast('Error eliminando producto', 'danger');
    }
  }

async addNewProduct() {
  const actionSheet = await this.actionSheetController.create({
    header: '➕ Agregar Producto',
    buttons: [
      {
        text: '🍕 Nueva Pizza',
        handler: () => {
          this.showAddPizzaModal();
        }
      },
      {
        text: '🥤 Nueva Bebida',
        handler: () => {
          this.showAddBebidaModal();
        }
      },
      {
        text: 'Cancelar',
        role: 'cancel'
      }
    ]
  });

  await actionSheet.present();
}

// Agregar estos métodos nuevos al final de la clase:
async showAddPizzaModal() {
  const modal = await this.modalController.create({
    component: AddPizzaModalComponent,
    cssClass: 'add-product-modal'
  });

  modal.onDidDismiss().then(async (result) => {
    if (result.data && result.data.pizza) {
      await this.handleAddPizza(result.data.pizza);
    }
  });

  await modal.present();
}

async showAddBebidaModal() {
  const modal = await this.modalController.create({
    component: AddBebidaModalComponent, 
    cssClass: 'add-product-modal'
  });

  modal.onDidDismiss().then(async (result) => {
    if (result.data && result.data.bebida) {
      await this.handleAddBebida(result.data.bebida);
    }
  });

  await modal.present();
}

private async handleAddPizza(pizzaData: any) {
  const loading = await this.loadingController.create({
    message: 'Agregando pizza...',
    spinner: 'crescent'
  });
  await loading.present();

  try {
    const nuevaPizza = {
      nombre: pizzaData.nombre,
      descripcion: pizzaData.descripcion,
      precio: pizzaData.precio,
      ingredientes: pizzaData.ingredientes,
      categoria: pizzaData.categoria,
      tamano: pizzaData.tamano,
      imagen: pizzaData.imagen || '',
      disponible: pizzaData.disponible
    };

    await this.pizzaService.addPizza(nuevaPizza);
    await this.loadData();
    await loading.dismiss();
    
    this.presentToast(`🍕 ${nuevaPizza.nombre} agregada exitosamente`, 'success');
    
  } catch (error) {
    await loading.dismiss();
    this.presentToast('Error agregando la pizza', 'danger');
  }
}

private async handleAddBebida(bebidaData: any) {
  const loading = await this.loadingController.create({
    message: 'Agregando bebida...',
    spinner: 'crescent'
  });
  await loading.present();

  try {
    const nuevaBebida = {
      nombre: bebidaData.nombre,
      precio: bebidaData.precio,
      tamano: bebidaData.tamano,
      imagen: bebidaData.imagen || '',
      disponible: bebidaData.disponible
    };

    await this.pizzaService.addBebida(nuevaBebida);
    await this.loadData();
    await loading.dismiss();
    
    this.presentToast(`🥤 ${nuevaBebida.nombre} agregada exitosamente`, 'success');
    
  } catch (error) {
    await loading.dismiss();
    this.presentToast('Error agregando la bebida', 'danger');
  }
}

  // Utilidades
  formatPrice(price: number): string {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(price);
  }

  getCategoryIcon(categoria: string): string {
    const icons: { [key: string]: string } = {
      'clasica': '🍕',
      'especial': '⭐',
      'vegana': '🌱',
      'personalizada': '🎨'
    };
    return icons[categoria] || '🍕';
  }

  getStatusColor(disponible: boolean): string {
    return disponible ? 'success' : 'danger';
  }

  getStatusText(disponible: boolean): string {
    return disponible ? 'Disponible' : 'No disponible';
  }

  trackByProductId(index: number, product: Pizza | Bebida): string {
    return product.id || index.toString();
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
  // Método para editar pizza
async editPizza(pizza: Pizza) {
  const modal = await this.modalController.create({
    component: EditPizzaModalComponent,
    cssClass: 'edit-product-modal',
    componentProps: {
      pizza: pizza
    }
  });

  modal.onDidDismiss().then(async (result) => {
    if (result.data && result.data.pizza) {
      await this.handleUpdatePizza(pizza.id!, result.data.pizza);
    }
  });

  await modal.present();
}

// Método para editar bebida
async editBebida(bebida: Bebida) {
  const modal = await this.modalController.create({
    component: EditBebidaModalComponent,
    cssClass: 'edit-product-modal',
    componentProps: {
      bebida: bebida
    }
  });

  modal.onDidDismiss().then(async (result) => {
    if (result.data && result.data.bebida) {
      await this.handleUpdateBebida(bebida.id!, result.data.bebida);
    }
  });

  await modal.present();
}

// Manejar actualización de pizza
private async handleUpdatePizza(pizzaId: string, pizzaData: any) {
  const loading = await this.loadingController.create({
    message: 'Actualizando pizza...',
    spinner: 'crescent'
  });
  await loading.present();

  try {
    const updatedPizza = {
      nombre: pizzaData.nombre,
      descripcion: pizzaData.descripcion,
      precio: pizzaData.precio,
      ingredientes: pizzaData.ingredientes,
      categoria: pizzaData.categoria,
      tamano: pizzaData.tamano,
      imagen: pizzaData.imagen || '',
      disponible: pizzaData.disponible
    };

    await this.pizzaService.updatePizza(pizzaId, updatedPizza);
    await this.loadData();
    await loading.dismiss();
    
    this.presentToast(`🍕 ${updatedPizza.nombre} actualizada exitosamente`, 'success');
    
  } catch (error) {
    await loading.dismiss();
    console.error('Error actualizando pizza:', error);
    this.presentToast('Error actualizando la pizza', 'danger');
  }
}

// Manejar actualización de bebida
private async handleUpdateBebida(bebidaId: string, bebidaData: any) {
  const loading = await this.loadingController.create({
    message: 'Actualizando bebida...',
    spinner: 'crescent'
  });
  await loading.present();

  try {
    const updatedBebida = {
      nombre: bebidaData.nombre,
      precio: bebidaData.precio,
      tamano: bebidaData.tamano,
      imagen: bebidaData.imagen || '',
      disponible: bebidaData.disponible
    };

    await this.pizzaService.updateBebida(bebidaId, updatedBebida);
    await this.loadData();
    await loading.dismiss();
    
    this.presentToast(`🥤 ${updatedBebida.nombre} actualizada exitosamente`, 'success');
    
  } catch (error) {
    await loading.dismiss();
    console.error('Error actualizando bebida:', error);
    this.presentToast('Error actualizando la bebida', 'danger');
  }
}
}