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
}

@Injectable({
  providedIn: 'root'
})
export class PizzaService {
  private carritoSubject = new BehaviorSubject<ItemCarrito[]>([]);
  public carrito$ = this.carritoSubject.asObservable();

  constructor(private firestore: Firestore) {
    this.initializeDefaultData();
  }

  // PIZZAS
  async getPizzas(): Promise<Pizza[]> {
    const pizzasCollection = collection(this.firestore, 'pizzas');
    const pizzasSnapshot = await getDocs(pizzasCollection);
    return pizzasSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Pizza[];
  }

  async addPizza(pizza: Omit<Pizza, 'id'>): Promise<string> {
    const pizzasCollection = collection(this.firestore, 'pizzas');
    const docRef = await addDoc(pizzasCollection, pizza);
    return docRef.id;
  }

  async updatePizza(id: string, pizza: Partial<Pizza>): Promise<void> {
    const pizzaDoc = doc(this.firestore, 'pizzas', id);
    await updateDoc(pizzaDoc, pizza);
  }

  async deletePizza(id: string): Promise<void> {
    const pizzaDoc = doc(this.firestore, 'pizzas', id);
    await deleteDoc(pizzaDoc);
  }

  // BEBIDAS
  async getBebidas(): Promise<Bebida[]> {
    const bebidasCollection = collection(this.firestore, 'bebidas');
    const bebidasSnapshot = await getDocs(bebidasCollection);
    return bebidasSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Bebida[];
  }

  async addBebida(bebida: Omit<Bebida, 'id'>): Promise<string> {
    const bebidasCollection = collection(this.firestore, 'bebidas');
    const docRef = await addDoc(bebidasCollection, bebida);
    return docRef.id;
  }

  // INGREDIENTES
  async getIngredientes(): Promise<Ingrediente[]> {
    const ingredientesCollection = collection(this.firestore, 'ingredientes');
    const ingredientesSnapshot = await getDocs(ingredientesCollection);
    return ingredientesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Ingrediente[];
  }

  async addIngrediente(ingrediente: Omit<Ingrediente, 'id'>): Promise<string> {
    const ingredientesCollection = collection(this.firestore, 'ingredientes');
    const docRef = await addDoc(ingredientesCollection, ingrediente);
    return docRef.id;
  }

  // CARRITO
  agregarAlCarrito(item: ItemCarrito) {
    const carritoActual = this.carritoSubject.value;
    const existingItem = carritoActual.find(i => i.id === item.id);
    
    if (existingItem) {
      existingItem.cantidad += item.cantidad;
    } else {
      carritoActual.push(item);
    }
    
    this.carritoSubject.next([...carritoActual]);
  }

  removerDelCarrito(itemId: string) {
    const carritoActual = this.carritoSubject.value.filter(item => item.id !== itemId);
    this.carritoSubject.next(carritoActual);
  }

  actualizarCantidad(itemId: string, cantidad: number) {
    const carritoActual = this.carritoSubject.value;
    const item = carritoActual.find(i => i.id === itemId);
    
    if (item) {
      item.cantidad = cantidad;
      if (cantidad <= 0) {
        this.removerDelCarrito(itemId);
      } else {
        this.carritoSubject.next([...carritoActual]);
      }
    }
  }

  limpiarCarrito() {
    this.carritoSubject.next([]);
  }

  getCarrito(): ItemCarrito[] {
    return this.carritoSubject.value;
  }

  getTotalCarrito(): number {
    return this.carritoSubject.value.reduce((total, item) => 
      total + (item.precio * item.cantidad), 0
    );
  }

  // PEDIDOS
  async crearPedido(pedido: Omit<Pedido, 'id'>): Promise<string> {
    const pedidosCollection = collection(this.firestore, 'pedidos');
    const docRef = await addDoc(pedidosCollection, {
      ...pedido,
      fechaCreacion: new Date()
    });
    
    // Limpiar carrito después de crear pedido
    this.limpiarCarrito();
    
    return docRef.id;
  }

  async getPedidosByUser(userId: string): Promise<Pedido[]> {
    const pedidosCollection = collection(this.firestore, 'pedidos');
    const q = query(
      pedidosCollection, 
      where('userId', '==', userId),
      orderBy('fechaCreacion', 'desc')
    );
    const pedidosSnapshot = await getDocs(q);
    return pedidosSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Pedido[];
  }

  async getAllPedidos(): Promise<Pedido[]> {
    const pedidosCollection = collection(this.firestore, 'pedidos');
    const q = query(pedidosCollection, orderBy('fechaCreacion', 'desc'));
    const pedidosSnapshot = await getDocs(q);
    return pedidosSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Pedido[];
  }

  async updatePedidoEstado(pedidoId: string, estado: Pedido['estado']): Promise<void> {
    const pedidoDoc = doc(this.firestore, 'pedidos', pedidoId);
    const updateData: any = { estado };
    
    if (estado === 'entregado') {
      updateData.fechaEntrega = new Date();
    }
    
    await updateDoc(pedidoDoc, updateData);
  }

  // Inicializar datos por defecto
  private async initializeDefaultData() {
    try {
      const pizzas = await this.getPizzas();
      if (pizzas.length === 0) {
        await this.createDefaultPizzas();
      }

      const bebidas = await this.getBebidas();
      if (bebidas.length === 0) {
        await this.createDefaultBebidas();
      }

      const ingredientes = await this.getIngredientes();
      if (ingredientes.length === 0) {
        await this.createDefaultIngredientes();
      }
    } catch (error) {
      console.error('Error inicializando datos:', error);
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
      { nombre: 'Agua', precio: 3000, tamano: '500ml', disponible: true },
      { nombre: 'Cerveza', precio: 8000, tamano: '330ml', disponible: true },
      { nombre: 'Jugo de Naranja', precio: 6000, tamano: '400ml', disponible: true }
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
      { nombre: 'Champiñones', precio: 2000, categoria: 'vegetales', disponible: true },
      { nombre: 'Pimientos', precio: 1500, categoria: 'vegetales', disponible: true },
      { nombre: 'Cebolla', precio: 1000, categoria: 'vegetales', disponible: true },
      { nombre: 'Piña', precio: 2000, categoria: 'vegetales', disponible: true },
      { nombre: 'Mozzarella Extra', precio: 2500, categoria: 'quesos', disponible: true },
      { nombre: 'Queso Cheddar', precio: 3000, categoria: 'quesos', disponible: true },
      { nombre: 'Salsa BBQ', precio: 1500, categoria: 'salsas', disponible: true },
      { nombre: 'Salsa Ranch', precio: 1500, categoria: 'salsas', disponible: true }
    ];

    for (const ingrediente of ingredientesDefault) {
      await this.addIngrediente(ingrediente);
    }
  }
}