import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { 
  IonContent, 
  IonHeader, 
  IonTitle, 
  IonToolbar,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonItem,
  IonLabel,
  IonInput,
  IonButton,
  IonButtons,
  IonBackButton,
  IonIcon,
  IonNote,
  IonText,
  IonCheckbox,
  AlertController,
  LoadingController,
  ToastController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { 
  logoGoogle, 
  personOutline, 
  mailOutline, 
  lockClosedOutline, 
  callOutline,
  eyeOutline,
  eyeOffOutline
} from 'ionicons/icons';

import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-register',
  templateUrl: './register.page.html',
  styleUrls: ['./register.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    IonContent, 
    IonHeader, 
    IonTitle, 
    IonToolbar,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonItem,
    IonLabel,
    IonInput,
    IonButton,
    IonButtons,
    IonBackButton,
    IonIcon,
    IonNote,
    IonText,
    IonCheckbox
  ]
})
export class RegisterPage implements OnInit {
  registerForm: FormGroup;
  showPassword = false;
  showConfirmPassword = false;
  acceptTerms = false;

  constructor(
    private formBuilder: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private alertController: AlertController,
    private loadingController: LoadingController,
    private toastController: ToastController
  ) {
    addIcons({ 
      logoGoogle, 
      personOutline, 
      mailOutline, 
      lockClosedOutline, 
      callOutline,
      eyeOutline,
      eyeOffOutline
    });

    // Crear formulario reactivo con validaciones
    this.registerForm = this.formBuilder.group({
      firstName: ['', [Validators.required, Validators.minLength(2)]],
      lastName: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', [Validators.pattern(/^[0-9]{10}$/)]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]]
    }, {
      validators: this.passwordMatchValidator
    });
  }

  ngOnInit() {
    console.log('📝 RegisterPage: Inicializada');
  }

  // Validador personalizado para confirmar contraseña
  passwordMatchValidator(form: FormGroup) {
    const password = form.get('password')?.value;
    const confirmPassword = form.get('confirmPassword')?.value;
    
    if (password !== confirmPassword) {
      form.get('confirmPassword')?.setErrors({ passwordMismatch: true });
      return { passwordMismatch: true };
    }
    
    return null;
  }

  // Alternar visibilidad de contraseña
  togglePasswordVisibility(field: 'password' | 'confirmPassword') {
    if (field === 'password') {
      this.showPassword = !this.showPassword;
    } else {
      this.showConfirmPassword = !this.showConfirmPassword;
    }
  }

  // Obtener mensajes de error para los campos
  getFieldError(fieldName: string): string {
    const field = this.registerForm.get(fieldName);
    
    if (field?.errors && field.touched) {
      if (field.errors['required']) {
        return `${this.getFieldLabel(fieldName)} es requerido`;
      }
      if (field.errors['email']) {
        return 'Ingresa un correo válido';
      }
      if (field.errors['minlength']) {
        const requiredLength = field.errors['minlength'].requiredLength;
        return `Mínimo ${requiredLength} caracteres`;
      }
      if (field.errors['pattern']) {
        if (fieldName === 'phone') {
          return 'Ingresa un número de 10 dígitos';
        }
      }
      if (field.errors['passwordMismatch']) {
        return 'Las contraseñas no coinciden';
      }
    }
    
    return '';
  }

  private getFieldLabel(fieldName: string): string {
    const labels: { [key: string]: string } = {
      firstName: 'Nombre',
      lastName: 'Apellido', 
      email: 'Correo',
      phone: 'Teléfono',
      password: 'Contraseña',
      confirmPassword: 'Confirmar contraseña'
    };
    return labels[fieldName] || fieldName;
  }

  // Verificar si un campo tiene errores
  hasFieldError(fieldName: string): boolean {
    const field = this.registerForm.get(fieldName);
    return !!(field?.errors && field.touched);
  }

  // Registro con email y contraseña
  async register() {
    if (!this.registerForm.valid) {
      this.markAllFieldsAsTouched();
      this.presentToast('Por favor completa todos los campos correctamente', 'warning');
      return;
    }

    if (!this.acceptTerms) {
      this.presentToast('Debes aceptar los términos y condiciones', 'warning');
      return;
    }

    const loading = await this.loadingController.create({
      message: 'Creando tu cuenta...',
      spinner: 'crescent',
      backdropDismiss: false
    });
    await loading.present();

    try {
      const formValue = this.registerForm.value;
      
      const userData = {
        email: formValue.email.trim().toLowerCase(),
        password: formValue.password,
        firstName: formValue.firstName.trim(),
        lastName: formValue.lastName.trim(),
        phone: formValue.phone?.trim() || undefined
      };

      console.log('📝 Registrando usuario:', userData.email);
      
      const result = await this.authService.register(userData);
      
      await loading.dismiss();
      
      // Mostrar mensaje de éxito
      await this.showSuccessMessage(result.profile.displayName);
      
      // Navegar al home
      this.router.navigate(['/home']);
      
    } catch (error) {
      await loading.dismiss();
      console.error('❌ Error en registro:', error);
      
      const errorMessage = this.authService.getErrorMessage(error);
      this.presentAlert('Error al registrarse', errorMessage);
    }
  }

  // Registro con Google
  async registerWithGoogle() {
    const loading = await this.loadingController.create({
      message: 'Conectando con Google...',
      spinner: 'crescent',
      backdropDismiss: false
    });
    await loading.present();

    try {
      console.log('📝 Registro con Google...');
      
      const result = await this.authService.loginWithGoogle();
      
      await loading.dismiss();
      
      await this.showSuccessMessage(result.profile.displayName);
      this.router.navigate(['/home']);
      
    } catch (error) {
      await loading.dismiss();
      console.error('❌ Error en registro con Google:', error);
      
      const errorMessage = this.authService.getErrorMessage(error);
      this.presentAlert('Error con Google', errorMessage);
    }
  }

  // Mostrar mensaje de éxito
  private async showSuccessMessage(displayName: string) {
    const alert = await this.alertController.create({
      header: '🎉 ¡Bienvenido!',
      message: `
        <div style="text-align: center; padding: 1rem;">
          <h3 style="color: var(--ion-color-primary); margin-bottom: 1rem;">
            ¡Hola ${displayName}! 👋
          </h3>
          <p style="line-height: 1.5; margin-bottom: 1rem;">
            Tu cuenta ha sido creada exitosamente.<br>
            ¡Ya puedes empezar a pedir tus pizzas favoritas!
          </p>
          <div style="background: var(--ion-color-light); padding: 0.75rem; border-radius: 8px; margin-top: 1rem;">
            <small style="color: var(--ion-color-medium);">
              🍕 Descubre nuestro menú<br>
              🛒 Agrega productos al carrito<br>
              💳 Paga fácil y seguro
            </small>
          </div>
        </div>
      `,
      buttons: [
        {
          text: '¡Empezar a comprar! 🚀',
          cssClass: 'primary-button'
        }
      ],
      backdropDismiss: false
    });

    await alert.present();
  }

  // Marcar todos los campos como tocados para mostrar errores
  private markAllFieldsAsTouched() {
    Object.keys(this.registerForm.controls).forEach(key => {
      this.registerForm.get(key)?.markAsTouched();
    });
  }

  // Navegar al login
  goToLogin() {
    this.router.navigate(['/login']);
  }

  // Mostrar términos y condiciones
  async showTerms() {
    const alert = await this.alertController.create({
      header: 'Términos y Condiciones',
      message: `
        <div style="text-align: left; max-height: 300px; overflow-y: auto;">
          <h4>🍕 PizzaApp - Términos de Servicio</h4>
          <p><strong>1. Aceptación de términos</strong></p>
          <p>Al usar PizzaApp, aceptas estos términos de servicio.</p>
          
          <p><strong>2. Uso del servicio</strong></p>
          <p>• Debes proporcionar información veraz y actualizada</p>
          <p>• Eres responsable de la seguridad de tu cuenta</p>
          <p>• No puedes usar el servicio para actividades ilegales</p>
          
          <p><strong>3. Pedidos y pagos</strong></p>
          <p>• Los precios están sujetos a cambios</p>
          <p>• Los pagos se procesan de forma segura</p>
          <p>• Tiempo de entrega estimado: 30-45 minutos</p>
          
          <p><strong>4. Privacidad</strong></p>
          <p>Respetamos tu privacidad y protegemos tus datos personales según nuestra política de privacidad.</p>
          
          <p><strong>5. Contacto</strong></p>
          <p>Para soporte: support@pizzaapp.com</p>
        </div>
      `,
      buttons: [
        {
          text: 'Cerrar',
          role: 'cancel'
        }
      ]
    });

    await alert.present();
  }

  // Utilitarios
  private async presentAlert(header: string, message: string) {
    const alert = await this.alertController.create({
      header,
      message,
      buttons: ['OK']
    });
    await alert.present();
  }

  private async presentToast(message: string, color: 'success' | 'danger' | 'warning' = 'success') {
    const toast = await this.toastController.create({
      message,
      duration: 3000,
      position: 'top',
      color,
      translucent: true
    });
    await toast.present();
  }
}