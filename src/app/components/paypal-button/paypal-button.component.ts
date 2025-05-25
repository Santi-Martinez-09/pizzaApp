import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';

declare var paypal: any;

@Component({
  selector: 'app-paypal-button',
  standalone: true,
  imports: [CommonModule, IonicModule],
  templateUrl: './paypal-button.component.html',
  styleUrls: ['./paypal-button.component.scss']
})
export class PaypalButtonComponent implements OnInit {
  ngOnInit(): void {
    paypal.Buttons({
      createOrder: (data: any, actions: any) => {
        return actions.order.create({
          purchase_units: [{
            amount: {
              value: '10.00' // ← puedes cambiar esto luego por el total del carrito
            }
          }]
        });
      },
      onApprove: (data: any, actions: any) => {
        return actions.order.capture().then((details: any) => {
          alert('✅ Pago completado por ' + details.payer.name.given_name);
          this.confirmarPedido();
        });
      }
    }).render('#paypal-button-container');
  }

  confirmarPedido() {
    alert('🚚 Pedido confirmado');
    // Aquí puedes llamar a Firebase u otra lógica de guardado
  }
}
