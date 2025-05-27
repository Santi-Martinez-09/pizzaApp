// src/app/services/carrito.service.ts
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class CarritoService {
  private carrito: any[] = [];

  // Agregar producto al carrito
  agregarProducto(producto: any): void {
    const index = this.carrito.findIndex(p => p.id === producto.id);
    if (index !== -1) {
      this.carrito[index].cantidad += producto.cantidad;
    } else {
      this.carrito.push(producto);
    }
  }

  // Obtener todos los productos
  obtenerCarrito(): any[] {
    return this.carrito;
  }

  // Calcular total del carrito
  obtenerTotal(): number {
    return this.carrito.reduce(
      (acc, prod) => acc + prod.precio * prod.cantidad,
      0
    );
  }

  // Limpiar carrito
  limpiarCarrito(): void {
    this.carrito = [];
  }
  // Eliminar un producto
  eliminarProducto(id: string): void {
    this.carrito = this.carrito.filter((item) => item.id !== id);
  }
}