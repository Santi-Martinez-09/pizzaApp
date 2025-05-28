import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import {
  IonContent,
  IonHeader,
  IonTitle,
  IonToolbar,
  IonButtons,
  IonMenuButton,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonItem,
  IonLabel,
  IonInput,
  IonButton,
  IonIcon,
  IonAvatar,
  IonChip,
  IonBadge,
  IonList,
  IonListHeader,
  IonNote,
  IonToggle,
  IonSelect,
  IonSelectOption,
  IonSegment,
  IonSegmentButton,
  IonText,
  AlertController,
  LoadingController,
  ToastController,
  ActionSheetController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  personOutline,
  mailOutline,
  callOutline,
  locationOutline,
  cameraOutline,
  saveOutline,
  settingsOutline,
  statsChartOutline,
  shieldCheckmarkOutline,
  timeOutline,
  receiptOutline,
  cardOutline,
  notificationsOutline,
  colorPaletteOutline,
  lockClosedOutline
} from 'ionicons/icons';
import { AuthService, UserProfile } from '../services/auth.service';

@Component({
  selector: 'app-perfil',
  templateUrl: './perfil.page.html',
  styleUrls: ['./perfil.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    IonContent,
    IonHeader,
    IonTitle,
    IonToolbar,
    IonButtons,
    IonMenuButton,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonItem,
    IonLabel,
    IonInput,
    IonButton,
    IonIcon,
    IonAvatar,
    IonChip,
    IonBadge,
    IonList,
    IonListHeader,
    IonNote,
    IonToggle,
    IonSelect,
    IonSelectOption,
    IonSegment,
    IonSegmentButton,
    IonText
  ]
})
export class PerfilPage implements OnInit {
  userProfile: UserProfile | null = null;
  profileForm: FormGroup;
  preferencesForm: FormGroup;
  selectedSegment: 'perfil' | 'estadisticas' | 'configuracion' = 'perfil';
  isEditing = false;
  isLoading = false;

  constructor(
    private authService: AuthService,
    private formBuilder: FormBuilder,
    private router: Router,
    private alertController: AlertController,
    private loadingController: LoadingController,
    private toastController: ToastController,
    private actionSheetController: ActionSheetController
  ) {
    addIcons({
      personOutline,
      mailOutline,
      callOutline,
      locationOutline,
      cameraOutline,
      saveOutline,
      settingsOutline,
      statsChartOutline,
      shieldCheckmarkOutline,
      timeOutline,
      receiptOutline,
      cardOutline,
      notificationsOutline,
      colorPaletteOutline,
      lockClosedOutline
    });

    // Formulario de perfil
    this.profileForm = this.formBuilder.group({
      firstName: ['', [Validators.required, Validators.minLength(2)]],
      lastName: ['', [Validators.required, Validators.minLength(2)]],
      phone: ['', [Validators.pattern(/^[0-9]{10}$/)]],
      address: ['']
    });

    // Formulario de preferencias
    this.preferencesForm = this.formBuilder.group({
      notifications: [true],
      newsletter: [true],
      theme: ['auto']
    });
  }

  async ngOnInit() {
    console.log('👤 PerfilPage: Inicializando...');
    
    // Suscribirse al perfil del usuario
    this.authService.userProfile$.subscribe(profile => {
      if (profile) {
        this.userProfile = profile;
        this.updateForms();
        console.log('👤 Perfil cargado:', profile.displayName);
      } else {
        console.log('👤 Sin perfil, redirigiendo al login');
        this.router.navigate(['/login']);
      }
    });

    // Verificar si hay perfil inicial
    const currentProfile = this.authService.getUserProfile();
    if (currentProfile) {
      this.userProfile = currentProfile;
      this.updateForms();
    }
  }

  // Actualizar formularios con datos del usuario
  updateForms() {
    if (this.userProfile) {
      this.profileForm.patchValue({
        firstName: this.userProfile.firstName || '',
        lastName: this.userProfile.lastName || '',
        phone: this.userProfile.phone || '',
        address: this.userProfile.address || ''
      });

      this.preferencesForm.patchValue({
        notifications: this.userProfile.preferences?.notifications ?? true,
        newsletter: this.userProfile.preferences?.newsletter ?? true,
        theme: this.userProfile.preferences?.theme ?? 'auto'
      });
    }
  }

  // Cambiar segmento activo
  onSegmentChange(event: any) {
    this.selectedSegment = event.detail.value;
  }

  // Alternar modo de edición
  toggleEdit() {
    if (this.isEditing) {
      // Cancelar edición - restaurar valores originales
      this.updateForms();
    }
    this.isEditing = !this.isEditing;
  }

  // Guardar cambios del perfil
  async saveProfile() {
    if (!this.profileForm.valid || !this.userProfile) {
      this.presentToast('Por favor completa todos los campos requeridos', 'warning');
      return;
    }

    const loading = await this.loadingController.create({
      message: 'Guardando cambios...',
      spinner: 'crescent'
    });
    await loading.present();

    try {
      const formValue = this.profileForm.value;
      const displayName = `${formValue.firstName} ${formValue.lastName}`.trim();

      const updates: Partial<UserProfile> = {
        firstName: formValue.firstName,
        lastName: formValue.lastName,
        displayName: displayName,
        phone: formValue.phone || '',
        address: formValue.address || ''
      };

      await this.authService.updateUserProfile(this.userProfile.uid, updates);
      
      await loading.dismiss();
      this.isEditing = false;
      
      this.presentToast('Perfil actualizado exitosamente', 'success');
      console.log('✅ Perfil actualizado');

    } catch (error) {
      await loading.dismiss();
      console.error('❌ Error actualizando perfil:', error);
      this.presentToast('Error actualizando el perfil', 'danger');
    }
  }

  // Guardar preferencias
  async savePreferences() {
    if (!this.userProfile) return;

    const loading = await this.loadingController.create({
      message: 'Guardando preferencias...',
      spinner: 'crescent'
    });
    await loading.present();

    try {
      const preferences = this.preferencesForm.value;
      
      await this.authService.updateUserProfile(this.userProfile.uid, {
        preferences: preferences
      });

      await loading.dismiss();
      this.presentToast('Preferencias guardadas', 'success');
      console.log('✅ Preferencias actualizadas');

    } catch (error) {
      await loading.dismiss();
      console.error('❌ Error guardando preferencias:', error);
      this.presentToast('Error guardando preferencias', 'danger');
    }
  }

  // Cambiar foto de perfil
  async changeProfilePicture() {
    const actionSheet = await this.actionSheetController.create({
      header: 'Cambiar foto de perfil',
      buttons: [
        {
          text: 'Tomar foto',
          icon: 'camera-outline',
          handler: () => {
            this.presentToast('Función de cámara en desarrollo', 'warning');
          }
        },
        {
          text: 'Seleccionar de galería',
          icon: 'images-outline',
          handler: () => {
            this.presentToast('Función de galería en desarrollo', 'warning');
          }
        },
        {
          text: 'Eliminar foto actual',
          icon: 'trash-outline',
          role: 'destructive',
          handler: () => {
            this.removeProfilePicture();
          }
        },
        {
          text: 'Cancelar',
          role: 'cancel'
        }
      ]
    });

    await actionSheet.present();
  }

  // Eliminar foto de perfil
  async removeProfilePicture() {
    if (!this.userProfile) return;

    try {
      await this.authService.updateUserProfile(this.userProfile.uid, {
        profileImage: ''
      });
      
      this.presentToast('Foto de perfil eliminada', 'success');
    } catch (error) {
      console.error('Error eliminando foto:', error);
      this.presentToast('Error eliminando la foto', 'danger');
    }
  }

  // Cambiar contraseña
  async changePassword() {
    const alert = await this.alertController.create({
      header: 'Cambiar contraseña',
      message: 'Se enviará un enlace de cambio de contraseña a tu correo electrónico.',
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Enviar enlace',
          handler: async () => {
            if (this.userProfile?.email) {
              try {
                await this.authService.resetPassword(this.userProfile.email);
                this.presentToast('Enlace enviado a tu correo', 'success');
              } catch (error) {
                console.error('Error enviando enlace:', error);
                this.presentToast('Error enviando el enlace', 'danger');
              }
            }
          }
        }
      ]
    });

    await alert.present();
  }

  // Desactivar cuenta
  async deactivateAccount() {
    const alert = await this.alertController.create({
      header: '⚠️ Desactivar cuenta',
      message: `
        <div style="text-align: left;">
          <p>¿Estás seguro de que deseas desactivar tu cuenta?</p>
          <p><strong>Esto significa que:</strong></p>
          <ul>
            <li>No podrás hacer nuevos pedidos</li>
            <li>Perderás acceso a tu historial</li>
            <li>Tendrás que contactar soporte para reactivarla</li>
          </ul>
        </div>
      `,
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Desactivar',
          role: 'destructive',
          handler: async () => {
            await this.performAccountDeactivation();
          }
        }
      ]
    });

    await alert.present();
  }

  // Realizar desactivación de cuenta
  async performAccountDeactivation() {
    if (!this.userProfile) return;

    const loading = await this.loadingController.create({
      message: 'Desactivando cuenta...',
      spinner: 'crescent'
    });
    await loading.present();

    try {
      await this.authService.updateUserProfile(this.userProfile.uid, {
        isActive: false
      });

      await loading.dismiss();
      
      const alert = await this.alertController.create({
        header: 'Cuenta desactivada',
        message: 'Tu cuenta ha sido desactivada. Para reactivarla, contacta nuestro soporte.',
        buttons: [
          {
            text: 'Entendido',
            handler: () => {
              this.authService.logout();
              this.router.navigate(['/login']);
            }
          }
        ],
        backdropDismiss: false
      });

      await alert.present();

    } catch (error) {
      await loading.dismiss();
      console.error('Error desactivando cuenta:', error);
      this.presentToast('Error desactivando la cuenta', 'danger');
    }
  }

  // Utilitarios
  getUserInitials(): string {
    if (!this.userProfile) return 'U';
    
    if (this.userProfile.firstName && this.userProfile.lastName) {
      return `${this.userProfile.firstName[0]}${this.userProfile.lastName[0]}`.toUpperCase();
    }
    
    if (this.userProfile.displayName) {
      const names = this.userProfile.displayName.split(' ').filter(name => name.trim());
      if (names.length > 1) {
        return `${names[0][0]}${names[1][0]}`.toUpperCase();
      } else if (names.length === 1 && names[0].length > 0) {
        return names[0][0].toUpperCase();
      }
    }
    
    if (this.userProfile.email && this.userProfile.email.length > 0) {
      return this.userProfile.email[0].toUpperCase();
    }
    
    return 'U';
  }

  getRoleDisplayName(): string {
    if (!this.userProfile?.role) return 'Usuario';
    return this.userProfile.role === 'admin' ? 'Administrador' : 'Cliente';
  }

  getRoleColor(): string {
    if (!this.userProfile?.role) return 'medium';
    return this.userProfile.role === 'admin' ? 'warning' : 'primary';
  }

  formatDate(timestamp: any): string {
    if (!timestamp) return 'No disponible';
    
    try {
      let date: Date;
      
      if (timestamp.seconds) {
        // Firebase Timestamp
        date = new Date(timestamp.seconds * 1000);
      } else if (timestamp.toDate) {
        // Firebase Timestamp con método toDate
        date = timestamp.toDate();
      } else if (timestamp instanceof Date) {
        // Date object
        date = timestamp;
      } else if (typeof timestamp === 'string' || typeof timestamp === 'number') {
        // String o number timestamp
        date = new Date(timestamp);
      } else {
        return 'Formato no válido';
      }
      
      return date.toLocaleDateString('es-CO', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (error) {
      console.error('Error formateando fecha:', error);
      return 'Error en fecha';
    }
  }

  formatPrice(price: number): string {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(price);
  }

  getFieldError(fieldName: string): string {
    const field = this.profileForm.get(fieldName);
    
    if (field?.errors && field.touched) {
      if (field.errors['required']) {
        return `${fieldName === 'firstName' ? 'Nombre' : 'Apellido'} es requerido`;
      }
      if (field.errors['minlength']) {
        return 'Mínimo 2 caracteres';
      }
      if (field.errors['pattern']) {
        return 'Número de teléfono inválido';
      }
    }
    
    return '';
  }

  hasFieldError(fieldName: string): boolean {
    const field = this.profileForm.get(fieldName);
    return !!(field?.errors && field.touched);
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
