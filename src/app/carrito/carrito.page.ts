import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { PaypalButtonComponent } from 'src/app/components/paypal-button/paypal-button.component';
import { ClimaInfoComponent } from 'src/app/components/clima-info/clima-info.component';

@Component({
  selector: 'app-carrito',
  standalone: true,
  imports: [IonicModule, CommonModule, PaypalButtonComponent, ClimaInfoComponent],
  templateUrl: './carrito.page.html',
  styleUrls: ['./carrito.page.scss']
})
export class CarritoPage implements OnInit {

  constructor() { }

  ngOnInit() {}
}
