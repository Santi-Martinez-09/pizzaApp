import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar } from '@ionic/angular/standalone';
import { PaypalButtonComponent } from 'src/app/components/paypal-button/paypal-button.component';
import { IonicModule } from '@ionic/angular';


@Component({
selector: 'app-carrito',
  standalone: true,
  imports: [IonicModule, CommonModule, PaypalButtonComponent],
  templateUrl: './carrito.page.html',
  styleUrls: ['./carrito.page.scss']
})
export class CarritoPage implements OnInit {

  constructor() { }

  ngOnInit() {
  }

}
