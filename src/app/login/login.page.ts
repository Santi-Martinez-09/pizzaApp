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
  IonIcon,
  AlertController,
  LoadingController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { logoGoogle } from 'ionicons/icons';

import { Auth, signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup, sendPasswordResetEmail } from '@angular/fire/auth';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
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
    IonIcon,
    CommonModule, 
    FormsModule
  ]
})
export class LoginPage implements OnInit {
  email: string = '';
  password: string = '';

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

  async login() {
    if (this.email && this.password) {
      const loading = await this.loadingController.create({
        message: 'Iniciando sesión...',
        spinner: 'crescent'
      });
      await loading.present();

      try {
        const userCredential = await signInWithEmailAndPassword(this.auth, this.email, this.password);
        console.log('Usuario autenticado:', userCredential.user);
        await loading.dismiss();
        this.router.navigate(['/home']);
      } catch (error) {
        await loading.dismiss();
        this.presentAlert('Error de inicio de sesión', this.getErrorMessage(error));
      }
    }
  }

  async loginWithGoogle() {
    const loading = await this.loadingController.create({
      message: 'Iniciando sesión con Google...',
      spinner: 'crescent'
    });
    await loading.present();

    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(this.auth, provider);
      console.log('Usuario Google autenticado:', result.user);
      await loading.dismiss();
      this.router.navigate(['/home']);
    } catch (error) {
      await loading.dismiss();
      this.presentAlert('Error de inicio con Google', this.getErrorMessage(error));
    }
  }

  async forgotPassword() {
    const alert = await this.alertController.create({
      header: 'Recuperar contraseña',
      inputs: [
        {
          name: 'email',
          type: 'email',
          placeholder: 'Ingresa tu correo electrónico'
        }
      ],
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Enviar',
          handler: async (data) => {
            if (data.email) {
              const loading = await this.loadingController.create({
                message: 'Enviando correo...',
                spinner: 'crescent'
              });
              await loading.present();
              
              try {
                await sendPasswordResetEmail(this.auth, data.email);
                await loading.dismiss();
                this.presentAlert('Correo enviado', 'Se ha enviado un correo para restablecer tu contraseña.');
                return true;
              } catch (error) {
                await loading.dismiss();
                this.presentAlert('Error', this.getErrorMessage(error));
                return false;
              }
            } else {
              return false;
            }
          }
        }
      ]
    });
    await alert.present();
  }

  goToRegister() {
    this.router.navigate(['/register']);
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
      case 'auth/invalid-email':
        return 'Correo electrónico inválido.';
      case 'auth/user-disabled':
        return 'Usuario deshabilitado.';
      case 'auth/user-not-found':
        return 'Usuario no encontrado.';
      case 'auth/wrong-password':
        return 'Contraseña incorrecta.';
      case 'auth/network-request-failed':
        return 'Error de conexión. Verifica tu conexión a internet.';
      case 'auth/too-many-requests':
        return 'Demasiados intentos fallidos. Inténtalo más tarde.';
      case 'auth/popup-closed-by-user':
        return 'Inicio de sesión cancelado.';
      default:
        return `Error: ${error.message}`;
    }
  }
}