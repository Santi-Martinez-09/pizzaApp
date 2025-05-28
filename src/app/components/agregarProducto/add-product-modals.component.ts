import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonButton,
  IonIcon,
  IonContent,
  IonItem,
  IonLabel,
  IonInput,
  IonTextarea,
  IonSelect,
  IonSelectOption,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonChip,
  IonCheckbox,
  IonText,
  ModalController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { closeOutline, addOutline } from 'ionicons/icons';

// ================ COMPONENTE MODAL PARA PIZZA ================
@Component({
  selector: 'app-add-pizza-modal',
  template: `
    <ion-header>
      <ion-toolbar color="primary">
        <ion-title>🍕 Agregar Nueva Pizza</ion-title>
        <ion-buttons slot="end">
          <ion-button (click)="dismiss()">
            <ion-icon name="close-outline"></ion-icon>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <form [formGroup]="pizzaForm" (ngSubmit)="onSubmit()">
        
        <!-- Nombre -->
        <ion-item fill="outline">
          <ion-label position="floating">Nombre de la Pizza *</ion-label>
          <ion-input 
            type="text" 
            formControlName="nombre"
            placeholder="Ej: Margarita Especial">
          </ion-input>
        </ion-item>
        <ion-text color="danger" *ngIf="isFieldInvalid('nombre')">
          <small>El nombre es requerido (mínimo 3 caracteres)</small>
        </ion-text>

        <!-- Descripción -->
        <ion-item fill="outline">
          <ion-label position="floating">Descripción *</ion-label>
          <ion-textarea 
            formControlName="descripcion"
            rows="3"
            placeholder="Describe los ingredientes y características...">
          </ion-textarea>
        </ion-item>
        <ion-text color="danger" *ngIf="isFieldInvalid('descripcion')">
          <small>La descripción es requerida (mínimo 10 caracteres)</small>
        </ion-text>

        <!-- Precio -->
        <ion-item fill="outline">
          <ion-label position="floating">Precio (COP) *</ion-label>
          <ion-input 
            type="number" 
            formControlName="precio"
            placeholder="25000">
          </ion-input>
        </ion-item>
        <ion-text color="danger" *ngIf="isFieldInvalid('precio')">
          <small>El precio debe ser mayor a 1000</small>
        </ion-text>

        <!-- Categoría -->
        <ion-item fill="outline">
          <ion-label>Categoría *</ion-label>
          <ion-select formControlName="categoria" placeholder="Selecciona categoría">
            <ion-select-option value="clasica">🍕 Clásica</ion-select-option>
            <ion-select-option value="especial">⭐ Especial</ion-select-option>
            <ion-select-option value="vegana">🌱 Vegana</ion-select-option>
            <ion-select-option value="personalizada">🎨 Personalizada</ion-select-option>
          </ion-select>
        </ion-item>

        <!-- Tamaño -->
        <ion-item fill="outline">
          <ion-label>Tamaño *</ion-label>
          <ion-select formControlName="tamano" placeholder="Selecciona tamaño">
            <ion-select-option value="pequeña">Pequeña</ion-select-option>
            <ion-select-option value="mediana">Mediana</ion-select-option>
            <ion-select-option value="grande">Grande</ion-select-option>
            <ion-select-option value="familiar">Familiar</ion-select-option>
          </ion-select>
        </ion-item>

        <!-- Ingredientes -->
        <ion-card>
          <ion-card-header>
            <ion-card-title>🧄 Ingredientes</ion-card-title>
          </ion-card-header>
          <ion-card-content>
            <div class="ingredientes-input">
              <ion-item fill="outline">
                <ion-label position="floating">Agregar ingrediente</ion-label>
                <ion-input 
                  #ingredienteInput
                  type="text" 
                  (keyup.enter)="addIngrediente(ingredienteInput.value); ingredienteInput.value = ''"
                  placeholder="Ej: Mozzarella">
                </ion-input>
                <ion-button 
                  slot="end" 
                  fill="clear" 
                  (click)="addIngrediente(ingredienteInput.value); ingredienteInput.value = ''">
                  <ion-icon name="add-outline"></ion-icon>
                </ion-button>
              </ion-item>
              
              <div class="ingredientes-list" *ngIf="ingredientes.length > 0">
                <ion-chip 
                  *ngFor="let ingrediente of ingredientes; let i = index"
                  color="primary">
                  <ion-label>{{ ingrediente }}</ion-label>
                  <ion-icon name="close-circle" (click)="removeIngrediente(i)"></ion-icon>
                </ion-chip>
              </div>
            </div>
          </ion-card-content>
        </ion-card>

        <!-- Imagen URL -->
        <ion-item fill="outline">
          <ion-label position="floating">URL de la imagen (opcional)</ion-label>
          <ion-input 
            type="url" 
            formControlName="imagen"
            placeholder="https://ejemplo.com/imagen.jpg">
          </ion-input>
        </ion-item>

        <!-- Disponible -->
        <ion-item>
          <ion-checkbox formControlName="disponible" slot="start"></ion-checkbox>
          <ion-label>Pizza disponible para pedidos</ion-label>
        </ion-item>

        <!-- Botones -->
        <div class="form-buttons">
          <ion-button 
            expand="block" 
            type="submit" 
            [disabled]="!pizzaForm.valid || ingredientes.length === 0"
            class="submit-btn">
            <ion-icon name="add-outline" slot="start"></ion-icon>
            Agregar Pizza
          </ion-button>
          
          <ion-button 
            expand="block" 
            fill="outline" 
            (click)="dismiss()">
            Cancelar
          </ion-button>
        </div>
      </form>
    </ion-content>
  `,
  styles: [`
    .ingredientes-input {
      margin-bottom: 1rem;
    }
    
    .ingredientes-list {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
      margin-top: 1rem;
    }
    
    .form-buttons {
      margin-top: 2rem;
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }
    
    .submit-btn {
      --background: linear-gradient(45deg, var(--ion-color-primary), var(--ion-color-secondary));
      font-weight: 600;
    }
    
    ion-item {
      margin-bottom: 1rem;
    }
    
    .ng-invalid.ng-touched {
      --border-color: var(--ion-color-danger) !important;
    }
  `],
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonButton,
    IonIcon,
    IonContent,
    IonItem,
    IonLabel,
    IonInput,
    IonTextarea,
    IonSelect,
    IonSelectOption,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonChip,
    IonCheckbox,
    IonText
  ]
})
export class AddPizzaModalComponent implements OnInit {
  pizzaForm: FormGroup;
  ingredientes: string[] = [];

  constructor(
    private modalController: ModalController,
    private formBuilder: FormBuilder
  ) {
    addIcons({ closeOutline, addOutline });
    
    this.pizzaForm = this.formBuilder.group({
      nombre: ['', [Validators.required, Validators.minLength(3)]],
      descripcion: ['', [Validators.required, Validators.minLength(10)]],
      precio: [0, [Validators.required, Validators.min(1000)]],
      categoria: ['', Validators.required],
      tamano: ['mediana', Validators.required],
      imagen: [''],
      disponible: [true]
    });
  }

  ngOnInit() {}

addIngrediente(ingrediente: any) {
  if (ingrediente && typeof ingrediente === 'string' && ingrediente.trim() && !this.ingredientes.includes(ingrediente.trim())) {
    this.ingredientes.push(ingrediente.trim());
  }
}

  removeIngrediente(index: number) {
    this.ingredientes.splice(index, 1);
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.pizzaForm.get(fieldName);
    return !!(field && field.invalid && field.touched);
  }

  onSubmit() {
    if (this.pizzaForm.valid && this.ingredientes.length > 0) {
      const pizzaData = {
        ...this.pizzaForm.value,
        ingredientes: this.ingredientes
      };
      
      this.modalController.dismiss({
        pizza: pizzaData
      });
    }
  }

  dismiss() {
    this.modalController.dismiss();
  }
}

// ================ COMPONENTE MODAL PARA BEBIDA ================
@Component({
  selector: 'app-add-bebida-modal',
  template: `
    <ion-header>
      <ion-toolbar color="tertiary">
        <ion-title>🥤 Agregar Nueva Bebida</ion-title>
        <ion-buttons slot="end">
          <ion-button (click)="dismiss()">
            <ion-icon name="close-outline"></ion-icon>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <form [formGroup]="bebidaForm" (ngSubmit)="onSubmit()">
        
        <!-- Nombre -->
        <ion-item fill="outline">
          <ion-label position="floating">Nombre de la Bebida *</ion-label>
          <ion-input 
            type="text" 
            formControlName="nombre"
            placeholder="Ej: Coca Cola">
          </ion-input>
        </ion-item>
        <ion-text color="danger" *ngIf="isFieldInvalid('nombre')">
          <small>El nombre es requerido (mínimo 2 caracteres)</small>
        </ion-text>

        <!-- Precio -->
        <ion-item fill="outline">
          <ion-label position="floating">Precio (COP) *</ion-label>
          <ion-input 
            type="number" 
            formControlName="precio"
            placeholder="5000">
          </ion-input>
        </ion-item>
        <ion-text color="danger" *ngIf="isFieldInvalid('precio')">
          <small>El precio debe ser mayor a 500</small>
        </ion-text>

        <!-- Tamaño -->
        <ion-item fill="outline">
          <ion-label position="floating">Tamaño/Presentación *</ion-label>
          <ion-input 
            type="text" 
            formControlName="tamano"
            placeholder="Ej: 500ml, 1L, Lata 330ml">
          </ion-input>
        </ion-item>
        <ion-text color="danger" *ngIf="isFieldInvalid('tamano')">
          <small>El tamaño es requerido</small>
        </ion-text>

        <!-- Imagen URL -->
        <ion-item fill="outline">
          <ion-label position="floating">URL de la imagen (opcional)</ion-label>
          <ion-input 
            type="url" 
            formControlName="imagen"
            placeholder="https://ejemplo.com/bebida.jpg">
          </ion-input>
        </ion-item>

        <!-- Disponible -->
        <ion-item>
          <ion-checkbox formControlName="disponible" slot="start"></ion-checkbox>
          <ion-label>Bebida disponible para pedidos</ion-label>
        </ion-item>

        <!-- Botones -->
        <div class="form-buttons">
          <ion-button 
            expand="block" 
            type="submit" 
            [disabled]="!bebidaForm.valid"
            class="submit-btn">
            <ion-icon name="add-outline" slot="start"></ion-icon>
            Agregar Bebida
          </ion-button>
          
          <ion-button 
            expand="block" 
            fill="outline" 
            (click)="dismiss()">
            Cancelar
          </ion-button>
        </div>
      </form>
    </ion-content>
  `,
  styles: [`
    .form-buttons {
      margin-top: 2rem;
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }
    
    .submit-btn {
      --background: linear-gradient(45deg, var(--ion-color-tertiary), var(--ion-color-success));
      font-weight: 600;
    }
    
    ion-item {
      margin-bottom: 1rem;
    }
    
    .ng-invalid.ng-touched {
      --border-color: var(--ion-color-danger) !important;
    }
  `],
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonButton,
    IonIcon,
    IonContent,
    IonItem,
    IonLabel,
    IonInput,
    IonCheckbox,
    IonText
  ]
})
export class AddBebidaModalComponent implements OnInit {
  bebidaForm: FormGroup;

  constructor(
    private modalController: ModalController,
    private formBuilder: FormBuilder
  ) {
    addIcons({ closeOutline, addOutline });
    
    this.bebidaForm = this.formBuilder.group({
      nombre: ['', [Validators.required, Validators.minLength(2)]],
      precio: [0, [Validators.required, Validators.min(500)]],
      tamano: ['', Validators.required],
      imagen: [''],
      disponible: [true]
    });
  }

  ngOnInit() {}

  isFieldInvalid(fieldName: string): boolean {
    const field = this.bebidaForm.get(fieldName);
    return !!(field && field.invalid && field.touched);
  }

  onSubmit() {
    if (this.bebidaForm.valid) {
      this.modalController.dismiss({
        bebida: this.bebidaForm.value
      });
    }
  }

  dismiss() {
    this.modalController.dismiss();
  }
}