import { Injectable } from '@angular/core';
import { 
  Firestore, 
  collection, 
  addDoc, 
  getDocs, 
  doc, 
  updateDoc, 
  deleteDoc,
  query,
  where,
  orderBy
} from '@angular/fire/firestore';
import { Observable, BehaviorSubject } from 'rxjs';

export interface Ingrediente {
  id?: string;
  nombre: string;
  precio: number;
  categoria: 'carne' | 'vegetales' | 'quesos' | 'salsas';
  disponible: boolean;
}

export interface Pizza {
  id?: string;
  nombre: string;
  descripcion: string;
  precio: number;
  ingredientes: string[];
  imagen?: string;
  categoria: 'clasica' | 'especial' | 'vegana' | 'personalizada';
  disponible: boolean;
  tamano: 'pequeña' | 'mediana' | 'grande' | 'familiar';
}

export interface Bebida {
  id?: string;
  nombre: string;
  precio: number;
  tamano: string;
  disponible: boolean;
  imagen?: string;
}

export interface ItemCarrito {
  id: string;
  tipo: 'pizza' | 'bebida';
  item: Pizza | Bebida;
  cantidad: number;
  precio: number;
  personalizaciones?: string[];
}

export interface Pedido {
  id?: string;
  userId: string;
  items: ItemCarrito[];
  total: number;
  domicilio: number;
  direccion: string;
  telefono: string;
  estado: 'pendiente' | 'preparando' | 'enviado' | 'entregado' | 'cancelado';
  fechaCreacion: Date;
  fechaEntrega?: Date;
  metodoPago: string;
  coordenadas?: {
    lat: number;
    lng: number;
  };
  paypalTransactionId?: string;
  datosEntrega?: {
    nombre?: string;
    telefono?: string;
    direccion?: string;
    detalles?: string;
  };
  distanciaInfo?: {
    distancia: string;
    duracion: string;
    distanciaMetros: number;
    duracionMinutos: number;
  };
}

@Injectable({
  providedIn: 'root'
})
export class PizzaService {
  private carritoSubject = new BehaviorSubject<ItemCarrito[]>([]);
  public carrito$ = this.carritoSubject.asObservable();

  constructor(private firestore: Firestore) {
    console.log('PizzaService: Inicializando servicio...');
    this.loadCarritoFromStorage();
    this.initializeDefaultData();
  }

  // CARRITO - Métodos mejorados
  agregarAlCarrito(item: ItemCarrito) {
    console.log('PizzaService: Agregando al carrito:', item);
    
    const carritoActual = this.carritoSubject.value;
    
    // Buscar si ya existe un item similar (mismo producto)
    const existingItemIndex = carritoActual.findIndex(i => 
      i.tipo === item.tipo && 
      i.item.id === item.item.id
    );
    
    if (existingItemIndex !== -1) {
      // Si existe, aumentar cantidad
      carritoActual[existingItemIndex].cantidad += item.cantidad;
      console.log('PizzaService: Item existente, aumentando cantidad');
    } else {
      // Si no existe, agregar nuevo
      carritoActual.push({ ...item });
      console.log('PizzaService: Nuevo item agregado');
    }
    
    this.carritoSubject.next([...carritoActual]);
    this.saveCarritoToStorage();
    
    console.log('PizzaService: Carrito actualizado, total items:', carritoActual.length);
  }

  removerDelCarrito(itemId: string) {
    console.log('PizzaService: Removiendo del carrito ID:', itemId);
    
    const carritoActual = this.carritoSubject.value.filter(item => item.id !== itemId);
    this.carritoSubject.next(carritoActual);
    this.saveCarritoToStorage();
    
    console.log('PizzaService: Item removido, items restantes:', carritoActual.length);
  }

  actualizarCantidad(itemId: string, cantidad: number) {
    console.log('PizzaService: Actualizando cantidad para ID:', itemId, 'nueva cantidad:', cantidad);
    
    const carritoActual = [...this.carritoSubject.value];
    const itemIndex = carritoActual.findIndex(i => i.id === itemId);
    
    if (itemIndex !== -1) {
      if (cantidad <= 0) {
        // Si cantidad es 0 o menor, remover item
        carritoActual.splice(itemIndex, 1);
        console.log('PizzaService: Item removido por cantidad 0');
      } else {
        // Actualizar cantidad
        carritoActual[itemIndex].cantidad = cantidad;
        console.log('PizzaService: Cantidad actualizada');
      }
      
      this.carritoSubject.next(carritoActual);
      this.saveCarritoToStorage();
    } else {
      console.error('PizzaService: Item no encontrado para actualizar cantidad');
    }
  }

  limpiarCarrito() {
    console.log('PizzaService: Limpiando carrito completo');
    this.carritoSubject.next([]);
    this.saveCarritoToStorage();
  }

  getCarrito(): ItemCarrito[] {
    return this.carritoSubject.value;
  }

  getTotalCarrito(): number {
    const total = this.carritoSubject.value.reduce((total, item) => 
      total + (item.precio * item.cantidad), 0
    );
    console.log('PizzaService: Total calculado:', total);
    return total;
  }

  // PERSISTENCIA LOCAL
  private saveCarritoToStorage() {
    try {
      const carrito = this.carritoSubject.value;
      localStorage.setItem('pizzaapp_carrito', JSON.stringify(carrito));
      console.log('PizzaService: Carrito guardado en localStorage');
    } catch (error) {
      console.error('PizzaService: Error guardando carrito:', error);
    }
  }

  private loadCarritoFromStorage() {
    try {
      const carritoStorage = localStorage.getItem('pizzaapp_carrito');
      if (carritoStorage) {
        const carrito = JSON.parse(carritoStorage);
        this.carritoSubject.next(carrito);
        console.log('PizzaService: Carrito cargado desde localStorage:', carrito.length, 'items');
      }
    } catch (error) {
      console.error('PizzaService: Error cargando carrito:', error);
      this.carritoSubject.next([]);
    }
  }

  // PIZZAS
  async getPizzas(): Promise<Pizza[]> {
    try {
      const pizzasCollection = collection(this.firestore, 'pizzas');
      const pizzasSnapshot = await getDocs(pizzasCollection);
      const pizzas = pizzasSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Pizza[];
      
      console.log('PizzaService: Pizzas obtenidas:', pizzas.length);
      return pizzas;
    } catch (error) {
      console.error('PizzaService: Error obteniendo pizzas:', error);
      return [];
    }
  }

  async addPizza(pizza: Omit<Pizza, 'id'>): Promise<string> {
    const pizzasCollection = collection(this.firestore, 'pizzas');
    const docRef = await addDoc(pizzasCollection, pizza);
    console.log('PizzaService: Pizza agregada con ID:', docRef.id);
    return docRef.id;
  }

  async updatePizza(id: string, pizza: Partial<Pizza>): Promise<void> {
    const pizzaDoc = doc(this.firestore, 'pizzas', id);
    await updateDoc(pizzaDoc, pizza);
    console.log('PizzaService: Pizza actualizada:', id);
  }

  async deletePizza(id: string): Promise<void> {
    const pizzaDoc = doc(this.firestore, 'pizzas', id);
    await deleteDoc(pizzaDoc);
    console.log('PizzaService: Pizza eliminada:', id);
  }

  // BEBIDAS
  async getBebidas(): Promise<Bebida[]> {
    try {
      const bebidasCollection = collection(this.firestore, 'bebidas');
      const bebidasSnapshot = await getDocs(bebidasCollection);
      const bebidas = bebidasSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Bebida[];
      
      console.log('PizzaService: Bebidas obtenidas:', bebidas.length);
      return bebidas;
    } catch (error) {
      console.error('PizzaService: Error obteniendo bebidas:', error);
      return [];
    }
  }

  async addBebida(bebida: Omit<Bebida, 'id'>): Promise<string> {
    const bebidasCollection = collection(this.firestore, 'bebidas');
    const docRef = await addDoc(bebidasCollection, bebida);
    console.log('PizzaService: Bebida agregada con ID:', docRef.id);
    return docRef.id;
  }

  // INGREDIENTES
  async getIngredientes(): Promise<Ingrediente[]> {
    try {
      const ingredientesCollection = collection(this.firestore, 'ingredientes');
      const ingredientesSnapshot = await getDocs(ingredientesCollection);
      return ingredientesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Ingrediente[];
    } catch (error) {
      console.error('PizzaService: Error obteniendo ingredientes:', error);
      return [];
    }
  }

  async addIngrediente(ingrediente: Omit<Ingrediente, 'id'>): Promise<string> {
    const ingredientesCollection = collection(this.firestore, 'ingredientes');
    const docRef = await addDoc(ingredientesCollection, ingrediente);
    return docRef.id;
  }

  // PEDIDOS
async crearPedido(pedido: Omit<Pedido, 'id'>): Promise<string> {
  try {
    console.log('🔍 PIZZA SERVICE - CREAR PEDIDO:');
    console.log('  userId recibido:', `"${pedido.userId}"`);
    console.log('  userId tipo:', typeof pedido.userId);
    console.log('  userId length:', pedido.userId?.length);
    
    const pedidosCollection = collection(this.firestore, 'pedidos');
    const docRef = await addDoc(pedidosCollection, {
      ...pedido,
      userId: pedido.userId, // ✅ Asegurar que se guarde
      fechaCreacion: new Date()
    });
    
    console.log('✅ PIZZA SERVICE: Pedido creado con ID:', docRef.id);
    console.log('✅ PIZZA SERVICE: userId guardado:', `"${pedido.userId}"`);
    
    // Limpiar carrito después de crear pedido exitosamente
    this.limpiarCarrito();
    
    return docRef.id;
  } catch (error) {
    console.error('❌ PIZZA SERVICE: Error creando pedido:', error);
    throw error;
  }
}

async getPedidosByUser(userId: string): Promise<Pedido[]> {
  try {
    console.log('🔍 PIZZA SERVICE - GET PEDIDOS BY USER:');
    console.log('  userId buscado:', `"${userId}"`);
    console.log('  userId tipo:', typeof userId);
    console.log('  userId length:', userId?.length);
    
    const pedidosCollection = collection(this.firestore, 'pedidos');
    const q = query(
      pedidosCollection, 
      where('userId', '==', userId),
      orderBy('fechaCreacion', 'desc')
    );
    
    const pedidosSnapshot = await getDocs(q);
    console.log('🔍 PIZZA SERVICE: Documentos encontrados en query:', pedidosSnapshot.size);
    
    const pedidos: Pedido[] = [];
    pedidosSnapshot.forEach((doc) => {
      const data = doc.data();
      console.log('🔍 PIZZA SERVICE: Documento encontrado:', {
        id: doc.id,
        userId: `"${data['userId']}"`,
        userIdTipo: typeof data['userId'],
        coincide: data['userId'] === userId,
        fechaCreacion: data['fechaCreacion'],
        total: data['total']
      });
      
      pedidos.push({
        id: doc.id,
        ...data
      } as Pedido);
    });
    
    console.log('✅ PIZZA SERVICE: Pedidos procesados:', pedidos.length);
    return pedidos;
  } catch (error) {
    console.error('❌ PIZZA SERVICE: Error obteniendo pedidos del usuario:', error);
    console.error('❌ PIZZA SERVICE: Error completo:', error);
    return [];
  }
}

async getAllPedidos(): Promise<Pedido[]> {
  try {
    console.log('🔍 PIZZA SERVICE - GET ALL PEDIDOS:');
    
    const pedidosCollection = collection(this.firestore, 'pedidos');
    const q = query(pedidosCollection, orderBy('fechaCreacion', 'desc'));
    const pedidosSnapshot = await getDocs(q);
    
    console.log('🔍 PIZZA SERVICE: Total documentos en colección:', pedidosSnapshot.size);
    
    const pedidos: Pedido[] = [];
    pedidosSnapshot.forEach((doc) => {
      const data = doc.data();
      console.log('🔍 PIZZA SERVICE: Pedido en BD:', {
        id: doc.id,
        userId: `"${data['userId']}"`,
        userIdTipo: typeof data['userId'],
        userIdLength: data['userId']?.length,
        fechaCreacion: data['fechaCreacion'],
        total: data['total'],
        estado: data['estado']
      });
      
      pedidos.push({
        id: doc.id,
        ...data
      } as Pedido);
    });
    
    // Mostrar resumen de userIds únicos
    const userIds = [...new Set(pedidos.map(p => p.userId).filter(Boolean))];
    console.log('🔍 PIZZA SERVICE: UserIds únicos encontrados:', userIds);
    
    return pedidos;
  } catch (error) {
    console.error('❌ PIZZA SERVICE: Error obteniendo todos los pedidos:', error);
    return [];
  }
}

  async updatePedidoEstado(pedidoId: string, estado: Pedido['estado']): Promise<void> {
    try {
      const pedidoDoc = doc(this.firestore, 'pedidos', pedidoId);
      const updateData: any = { estado };
      
      if (estado === 'entregado') {
        updateData.fechaEntrega = new Date();
      }
      
      await updateDoc(pedidoDoc, updateData);
      console.log('PizzaService: Estado del pedido actualizado:', pedidoId, estado);
    } catch (error) {
      console.error('PizzaService: Error actualizando estado del pedido:', error);
      throw error;
    }
  }

  // Inicializar datos por defecto
  private async initializeDefaultData() {
    try {
      const pizzas = await this.getPizzas();
      if (pizzas.length === 0) {
        console.log('PizzaService: Creando pizzas por defecto...');
        await this.createDefaultPizzas();
      }

      const bebidas = await this.getBebidas();
      if (bebidas.length === 0) {
        console.log('PizzaService: Creando bebidas por defecto...');
        await this.createDefaultBebidas();
      }

      const ingredientes = await this.getIngredientes();
      if (ingredientes.length === 0) {
        console.log('PizzaService: Creando ingredientes por defecto...');
        await this.createDefaultIngredientes();
      }
    } catch (error) {
      console.error('PizzaService: Error inicializando datos:', error);
    }
  }

  private async createDefaultPizzas() {
    const pizzasDefault: Omit<Pizza, 'id'>[] = [
      {
        nombre: 'Margarita',
        descripcion: 'Pizza clásica con salsa de tomate, mozzarella y albahaca fresca',
        precio: 25000,
        ingredientes: ['Salsa de tomate', 'Mozzarella', 'Albahaca'],
        categoria: 'clasica',
        disponible: true,
        tamano: 'mediana'
      },
      {
        nombre: 'Pepperoni',
        descripcion: 'Pizza con salsa de tomate, mozzarella y pepperoni',
        precio: 30000,
        ingredientes: ['Salsa de tomate', 'Mozzarella', 'Pepperoni'],
        categoria: 'clasica',
        disponible: true,
        tamano: 'mediana'
      },
      {
        nombre: 'Hawaiana',
        descripcion: 'Pizza con jamón, piña y mozzarella',
        precio: 32000,
        ingredientes: ['Salsa de tomate', 'Mozzarella', 'Jamón', 'Piña'],
        categoria: 'especial',
        disponible: true,
        tamano: 'mediana'
      },
      {
        nombre: 'Vegana Deluxe',
        descripcion: 'Pizza vegana con vegetales frescos y queso vegano',
        precio: 35000,
        ingredientes: ['Salsa de tomate', 'Queso vegano', 'Pimientos', 'Champiñones', 'Cebolla'],
        categoria: 'vegana',
        disponible: true,
        tamano: 'mediana'
      },
      {
        nombre: 'Cuatro Quesos',
        descripcion: 'Deliciosa combinación de mozzarella, parmesano, gorgonzola y ricotta',
        precio: 38000,
        ingredientes: ['Salsa blanca', 'Mozzarella', 'Parmesano', 'Gorgonzola', 'Ricotta'],
        categoria: 'especial',
        disponible: true,
        tamano: 'mediana'
      },
      {
        nombre: 'Carnívora',
        descripcion: 'Para los amantes de la carne: pepperoni, salchicha, jamón y tocino',
        precio: 42000,
        ingredientes: ['Salsa de tomate', 'Mozzarella', 'Pepperoni', 'Salchicha', 'Jamón', 'Tocino'],
        categoria: 'especial',
        disponible: true,
        tamano: 'mediana'
      }
    ];

    for (const pizza of pizzasDefault) {
      await this.addPizza(pizza);
    }
  }

  private async createDefaultBebidas() {
    const bebidasDefault: Omit<Bebida, 'id'>[] = [
      { nombre: 'Coca Cola', precio: 5000, tamano: '500ml', disponible: true },
      { nombre: 'Pepsi', precio: 5000, tamano: '500ml', disponible: true },
      { nombre: 'Sprite', precio: 5000, tamano: '500ml', disponible: true },
      { nombre: 'Fanta', precio: 5000, tamano: '500ml', disponible: true },
      { nombre: 'Agua', precio: 3000, tamano: '500ml', disponible: true },
      { nombre: 'Jugo de Naranja', precio: 6000, tamano: '400ml', disponible: true },
      { nombre: 'Jugo de Manzana', precio: 6000, tamano: '400ml', disponible: true },
      { nombre: 'Cerveza', precio: 8000, tamano: '330ml', disponible: true }
    ];

    for (const bebida of bebidasDefault) {
      await this.addBebida(bebida);
    }
  }

  private async createDefaultIngredientes() {
    const ingredientesDefault: Omit<Ingrediente, 'id'>[] = [
      { nombre: 'Pepperoni', precio: 3000, categoria: 'carne', disponible: true },
      { nombre: 'Jamón', precio: 2500, categoria: 'carne', disponible: true },
      { nombre: 'Salchicha', precio: 2500, categoria: 'carne', disponible: true },
      { nombre: 'Pollo', precio: 3500, categoria: 'carne', disponible: true },
      { nombre: 'Tocino', precio: 4000, categoria: 'carne', disponible: true },
      { nombre: 'Champiñones', precio: 2000, categoria: 'vegetales', disponible: true },
      { nombre: 'Pimientos', precio: 1500, categoria: 'vegetales', disponible: true },
      { nombre: 'Cebolla', precio: 1000, categoria: 'vegetales', disponible: true },
      { nombre: 'Piña', precio: 2000, categoria: 'vegetales', disponible: true },
      { nombre: 'Tomate', precio: 1500, categoria: 'vegetales', disponible: true },
      { nombre: 'Mozzarella Extra', precio: 2500, categoria: 'quesos', disponible: true },
      { nombre: 'Queso Cheddar', precio: 3000, categoria: 'quesos', disponible: true },
      { nombre: 'Parmesano', precio: 3500, categoria: 'quesos', disponible: true },
      { nombre: 'Salsa BBQ', precio: 1500, categoria: 'salsas', disponible: true },
      { nombre: 'Salsa Ranch', precio: 1500, categoria: 'salsas', disponible: true }
    ];

    for (const ingrediente of ingredientesDefault) {
      await this.addIngrediente(ingrediente);
    }
  }
  // ✅ MÉTODO NUEVO - Agregar este método
async updatePedido(pedidoId: string, data: Partial<Pedido>): Promise<void> {
  try {
    console.log('🔍 PIZZA SERVICE - UPDATE PEDIDO:', pedidoId, data);
    
    const pedidoDoc = doc(this.firestore, 'pedidos', pedidoId);
    await updateDoc(pedidoDoc, data);
    
    console.log('✅ PIZZA SERVICE: Pedido actualizado:', pedidoId);
  } catch (error) {
    console.error('❌ PIZZA SERVICE: Error actualizando pedido:', error);
    throw error;
  }
}
async updateBebida(id: string, bebida: Partial<Bebida>): Promise<void> {
  const bebidaDoc = doc(this.firestore, 'bebidas', id);
  await updateDoc(bebidaDoc, bebida);
  console.log('PizzaService: Bebida actualizada:', id);
}
}
