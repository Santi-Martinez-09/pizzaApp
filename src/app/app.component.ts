import { Component } from '@angular/core';
import { IonApp, IonRouterOutlet } from '@ionic/angular/standalone';
import { MenuComponent } from './components/menu/menu.component';

@Component({
  selector: 'app-root',
  template: `
    <ion-app>
      <app-menu></app-menu>
      <ion-router-outlet id="main-content"></ion-router-outlet>
    </ion-app>
  `,
  standalone: true,
  imports: [IonApp, IonRouterOutlet, MenuComponent],
})
export class AppComponent {
  constructor() {}
}
