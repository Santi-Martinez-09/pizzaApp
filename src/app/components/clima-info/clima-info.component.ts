import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';

@Component({
  selector: 'app-clima-info',
  standalone: true,
  imports: [CommonModule, IonicModule],
  template: `
    <ion-card>
      <ion-card-header>
        <ion-card-title>Clima Actual</ion-card-title>
      </ion-card-header>
      <ion-card-content>
        ☀️ Bogotá, 22°C, Soleado
      </ion-card-content>
    </ion-card>
  `,
})
export class ClimaInfoComponent {}
