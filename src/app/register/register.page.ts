import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
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
  AlertController,
  LoadingController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { logoGoogle } from 'ionicons/icons';

import { 
  Auth, 
  createUserWithEmailAndPassword, 
  GoogleAuthProvider, 
  signInWithPopup, 
  updateProfile 
} from '@angular/fire/auth';

@Component({
  selector: 'app-register',
  templateUrl: './register.page.html',
  styleUrls: ['./register.page.scss'],
  standalone: true,
  imports: [
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
    CommonModule, 
    FormsModule
  ]
})
export class RegisterPage implements OnInit {
  name: string = '';
  email: string = '';
  password: string = '';
  confirmPassword: string = '';

  constructor(
    private auth: Auth,
    private router: Router,
    private alertController: AlertController,
    private loadingController: LoadingController
  ) {
    addIcons({ logoGoogle });
  }

  ngOnInit() {
  }

  async register() {
    if (this.password !== this.confirmPassword) {
      this.presentAlert('Error', 'Las contraseñas no coinciden');
      return;
    }

    if (this.password.length < 6) {
      this.presentAlert('Error', 'La contraseña debe tener al menos 6 caracteres');
      return;
    }

    const loading = await this.loadingController.create({
      message: 'Creando cuenta...',
      spinner: 'crescent'
    });
    await loading.present();

    try {
      const userCredential = await createUserWithEmailAndPassword(
        this.auth, 
        this.email, 
        this.password
      );
      
      // Actualizar el perfil del usuario con el nombre
      if (userCredential.user) {
        await updateProfile(userCredential.user, {
          displayName: this.name
        });
      }
      
      console.log('Usuario registrado:', userCredential.user);
      await loading.dismiss();
      
      // Mostrar mensaje de éxito y redirigir al usuario
      await this.presentAlert('¡Registro exitoso!', 'Tu cuenta ha sido creada correctamente.');
      this.router.navigate(['/home']);
    } catch (error) {
      await loading.dismiss();
      this.presentAlert('Error al registrarse', this.getErrorMessage(error));
    }
  }

  async registerWithGoogle() {
    const loading = await this.loadingController.create({
      message: 'Procesando...',
      spinner: 'crescent'
    });
    await loading.present();

    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(this.auth, provider);
      console.log('Usuario registrado con Google:', result.user);
      await loading.dismiss();
      this.router.navigate(['/home']);
    } catch (error) {
      await loading.dismiss();
      this.presentAlert('Error al registrarse con Google', this.getErrorMessage(error));
    }
  }

  goToLogin() {
    this.router.navigate(['/login']);
  }

  private async presentAlert(header: string, message: string) {
    const alert = await this.alertController.create({
      header,
      message,
      buttons: ['OK']
    });
    await alert.present();
  }

  private getErrorMessage(error: any): string {
    switch (error.code) {
      case 'auth/email-already-in-use':
        return 'El correo electrónico ya está en uso por otra cuenta.';
      case 'auth/invalid-email':
        return 'El formato del correo electrónico no es válido.';
      case 'auth/operation-not-allowed':
        return 'La operación no está permitida.';
      case 'auth/weak-password':
        return 'La contraseña es demasiado débil. Debe tener al menos 6 caracteres.';
      case 'auth/network-request-failed':
        return 'Error de conexión. Verifica tu conexión a internet.';
      case 'auth/too-many-requests':
        return 'Demasiados intentos fallidos. Inténtalo más tarde.';
      case 'auth/popup-closed-by-user':
        return 'Registro cancelado. Has cerrado la ventana emergente.';
      default:
        return `Error: ${error.message}`;
    }
  }
}