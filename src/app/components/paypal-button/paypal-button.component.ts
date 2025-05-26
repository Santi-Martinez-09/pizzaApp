import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';

@Component({
  selector: 'app-paypal-button',
  standalone: true,
  imports: [CommonModule, IonicModule],
  templateUrl: './paypal-button.component.html',
})
export class PaypalButtonComponent {
  cargando = false;

  simularPago() {
    this.cargando = true;

    setTimeout(() => {
      this.cargando = false;
      alert('✅ Pago simulado completado correctamente.');
      this.confirmarPedido();
    }, 2000);
  }

  confirmarPedido() {
    alert('📦 Pedido confirmado con éxito.');
  }
}
