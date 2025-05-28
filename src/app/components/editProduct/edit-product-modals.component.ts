import { Component, OnInit, Input } from '@angular/core';
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
import { closeOutline, saveOutline, addOutline, closeCircle } from 'ionicons/icons';
import { Pizza, Bebida } from '../../services/pizza/pizza.service';

// ================ COMPONENTE MODAL PARA EDITAR PIZZA ================
@Component({
  selector: 'app-edit-pizza-modal',
  template: `
    <ion-header>
      <ion-toolbar color="primary">
        <ion-title>✏️ Editar Pizza</ion-title>
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
        <ion-item fill="outline" class="form-item">
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
        <ion-item fill="outline" class="form-item">
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
        <ion-item fill="outline" class="form-item">
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
        <ion-item fill="outline" class="form-item">
          <ion-label>Categoría *</ion-label>
          <ion-select formControlName="categoria" placeholder="Selecciona categoría">
            <ion-select-option value="clasica">🍕 Clásica</ion-select-option>
            <ion-select-option value="especial">⭐ Especial</ion-select-option>
            <ion-select-option value="vegana">🌱 Vegana</ion-select-option>
            <ion-select-option value="personalizada">🎨 Personalizada</ion-select-option>
          </ion-select>
        </ion-item>

        <!-- Tamaño -->
        <ion-item fill="outline" class="form-item">
          <ion-label>Tamaño *</ion-label>
          <ion-select formControlName="tamano" placeholder="Selecciona tamaño">
            <ion-select-option value="pequeña">Pequeña</ion-select-option>
            <ion-select-option value="mediana">Mediana</ion-select-option>
            <ion-select-option value="grande">Grande</ion-select-option>
            <ion-select-option value="familiar">Familiar</ion-select-option>
          </ion-select>
        </ion-item>

        <!-- Ingredientes -->
        <ion-card class="ingredientes-card">
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
                  color="primary"
                  class="ingrediente-chip">
                  <ion-label>{{ ingrediente }}</ion-label>
                  <ion-icon name="close-circle" (click)="removeIngrediente(i)"></ion-icon>
                </ion-chip>
              </div>
            </div>
          </ion-card-content>
        </ion-card>

        <!-- Imagen URL -->
        <ion-item fill="outline" class="form-item">
          <ion-label position="floating">URL de la imagen (opcional)</ion-label>
          <ion-input 
            type="url" 
            formControlName="imagen"
            placeholder="https://ejemplo.com/imagen.jpg">
          </ion-input>
        </ion-item>

        <!-- Disponible -->
        <ion-item class="checkbox-item">
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
            <ion-icon name="save-outline" slot="start"></ion-icon>
            Guardar Cambios
          </ion-button>
          
          <ion-button 
            expand="block" 
            fill="outline" 
            (click)="dismiss()"
            class="cancel-btn">
            Cancelar
          </ion-button>
        </div>
      </form>
    </ion-content>
  `,
  styles: [`
    .form-item {
      margin-bottom: 1rem;
      --border-radius: 12px;
    }
    
    .ingredientes-card {
      margin: 1rem 0;
      border-radius: 12px;
    }
    
    .ingredientes-input {
      margin-bottom: 1rem;
    }
    
    .ingredientes-list {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
      margin-top: 1rem;
    }
    
    .ingrediente-chip {
      cursor: pointer;
      transition: transform 0.2s ease;
    }
    
    .ingrediente-chip:hover {
      transform: scale(1.05);
    }
    
    .checkbox-item {
      margin: 1.5rem 0;
      --padding-start: 0;
    }
    
    .form-buttons {
      margin-top: 2rem;
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }
    
    .submit-btn {
      --background: linear-gradient(45deg, var(--ion-color-success), var(--ion-color-success-shade));
      --border-radius: 25px;
      font-weight: 600;
      height: 48px;
    }
    
    .cancel-btn {
      --border-radius: 25px;
      --border-width: 2px;
      font-weight: 600;
      height: 48px;
    }
    
    .ng-invalid.ng-touched {
      --border-color: var(--ion-color-danger) !important;
    }
    
    ion-text {
      display: block;
      margin-bottom: 0.5rem;
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
export class EditPizzaModalComponent implements OnInit {
  @Input() pizza!: Pizza;
  
  pizzaForm: FormGroup;
  ingredientes: string[] = [];

  constructor(
    private modalController: ModalController,
    private formBuilder: FormBuilder
  ) {
    addIcons({ closeOutline, saveOutline, addOutline, closeCircle });
    
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

  ngOnInit() {
    if (this.pizza) {
      // Cargar datos existentes de la pizza
      this.pizzaForm.patchValue({
        nombre: this.pizza.nombre,
        descripcion: this.pizza.descripcion,
        precio: this.pizza.precio,
        categoria: this.pizza.categoria,
        tamano: this.pizza.tamano,
        imagen: this.pizza.imagen || '',
        disponible: this.pizza.disponible
      });
      
      // Cargar ingredientes existentes
      this.ingredientes = [...this.pizza.ingredientes];
    }
  }

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

// ================ COMPONENTE MODAL PARA EDITAR BEBIDA ================
@Component({
  selector: 'app-edit-bebida-modal',
  template: `
    <ion-header>
      <ion-toolbar color="tertiary">
        <ion-title>✏️ Editar Bebida</ion-title>
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
        <ion-item fill="outline" class="form-item">
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
        <ion-item fill="outline" class="form-item">
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
        <ion-item fill="outline" class="form-item">
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
        <ion-item fill="outline" class="form-item">
          <ion-label position="floating">URL de la imagen (opcional)</ion-label>
          <ion-input 
            type="url" 
            formControlName="imagen"
            placeholder="https://ejemplo.com/bebida.jpg">
          </ion-input>
        </ion-item>

        <!-- Disponible -->
        <ion-item class="checkbox-item">
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
            <ion-icon name="save-outline" slot="start"></ion-icon>
            Guardar Cambios
          </ion-button>
          
          <ion-button 
            expand="block" 
            fill="outline" 
            (click)="dismiss()"
            class="cancel-btn">
            Cancelar
          </ion-button>
        </div>
      </form>
    </ion-content>
  `,
  styles: [`
    .form-item {
      margin-bottom: 1rem;
      --border-radius: 12px;
    }
    
    .checkbox-item {
      margin: 1.5rem 0;
      --padding-start: 0;
    }
    
    .form-buttons {
      margin-top: 2rem;
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }
    
    .submit-btn {
      --background: linear-gradient(45deg, var(--ion-color-success), var(--ion-color-success-shade));
      --border-radius: 25px;
      font-weight: 600;
      height: 48px;
    }
    
    .cancel-btn {
      --border-radius: 25px;
      --border-width: 2px;
      font-weight: 600;
      height: 48px;
    }
    
    .ng-invalid.ng-touched {
      --border-color: var(--ion-color-danger) !important;
    }
    
    ion-text {
      display: block;
      margin-bottom: 0.5rem;
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
export class EditBebidaModalComponent implements OnInit {
  @Input() bebida!: Bebida;
  
  bebidaForm: FormGroup;

  constructor(
    private modalController: ModalController,
    private formBuilder: FormBuilder
  ) {
    addIcons({ closeOutline, saveOutline });
    
    this.bebidaForm = this.formBuilder.group({
      nombre: ['', [Validators.required, Validators.minLength(2)]],
      precio: [0, [Validators.required, Validators.min(500)]],
      tamano: ['', Validators.required],
      imagen: [''],
      disponible: [true]
    });
  }

  ngOnInit() {
    if (this.bebida) {
      // Cargar datos existentes de la bebida
      this.bebidaForm.patchValue({
        nombre: this.bebida.nombre,
        precio: this.bebida.precio,
        tamano: this.bebida.tamano,
        imagen: this.bebida.imagen || '',
        disponible: this.bebida.disponible
      });
    }
  }

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