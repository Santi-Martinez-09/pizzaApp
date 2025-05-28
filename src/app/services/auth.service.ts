import { Injectable } from '@angular/core';
import {
  Auth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  GoogleAuthProvider,
  signInWithPopup,
  sendPasswordResetEmail,
  onAuthStateChanged,
  User,
  updateProfile
} from '@angular/fire/auth';
import { Firestore, doc, setDoc, getDoc, serverTimestamp } from '@angular/fire/firestore';
import { Observable, BehaviorSubject } from 'rxjs';

export interface UserProfile {
  uid: string;
  email: string;
  role: 'admin' | 'user';
  displayName: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  address?: string;
  profileImage?: string;
  isActive: boolean;
  createdAt: any; // Firebase Timestamp
  updatedAt: any; // Firebase Timestamp
  lastLogin?: any; // Firebase Timestamp
  preferences?: {
    notifications: boolean;
    newsletter: boolean;
    theme: 'light' | 'dark' | 'auto';
  };
  stats?: {
    totalOrders: number;
    totalSpent: number;
    favoriteCategory: string;
  };
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  private userProfileSubject = new BehaviorSubject<UserProfile | null>(null);
  
  public currentUser$ = this.currentUserSubject.asObservable();
  public userProfile$ = this.userProfileSubject.asObservable();

  constructor(
    private auth: Auth,
    private firestore: Firestore
  ) {
    console.log('🔐 AuthService: Inicializando...');
    
    // Escuchar cambios de autenticación con mejor manejo de errores
    onAuthStateChanged(this.auth, async (user) => {
      try {
        console.log('🔐 Estado de auth cambió:', user ? `Usuario: ${user.email}` : 'No autenticado');
        
        this.currentUserSubject.next(user);
        
        if (user) {
          await this.loadUserProfile(user.uid);
          await this.updateLastLogin(user.uid);
        } else {
          this.userProfileSubject.next(null);
        }
      } catch (error) {
        console.error('❌ Error en onAuthStateChanged:', error);
        // En caso de error, limpiar estado
        this.currentUserSubject.next(null);
        this.userProfileSubject.next(null);
      }
    });
  }

  // ============ MÉTODOS DE AUTENTICACIÓN ============

  async login(email: string, password: string): Promise<{ user: User; profile: UserProfile }> {
    try {
      console.log('🔐 Iniciando sesión para:', email);
      
      const result = await signInWithEmailAndPassword(this.auth, email, password);
      const profile = await this.loadUserProfile(result.user.uid);
      
      if (!profile) {
        throw new Error('Perfil de usuario no encontrado');
      }
      
      console.log('✅ Login exitoso:', profile.displayName);
      return { user: result.user, profile };
      
    } catch (error) {
      console.error('❌ Error en login:', error);
      throw error;
    }
  }

  async register(userData: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phone?: string;
  }): Promise<{ user: User; profile: UserProfile }> {
    try {
      console.log('🔐 Registrando usuario:', userData.email);
      
      // Crear usuario en Firebase Auth
      const result = await createUserWithEmailAndPassword(
        this.auth, 
        userData.email, 
        userData.password
      );
      
      const displayName = `${userData.firstName} ${userData.lastName}`.trim();
      
      // Actualizar perfil en Auth
      await updateProfile(result.user, {
        displayName: displayName
      });
      
      // Crear perfil completo en Firestore
      const userProfile: UserProfile = {
        uid: result.user.uid,
        email: result.user.email!,
        role: 'user', // Por defecto todos son usuarios
        displayName: displayName,
        firstName: userData.firstName,
        lastName: userData.lastName,
        phone: userData.phone || '',
        address: '',
        isActive: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        lastLogin: serverTimestamp(),
        preferences: {
          notifications: true,
          newsletter: true,
          theme: 'auto'
        },
        stats: {
          totalOrders: 0,
          totalSpent: 0,
          favoriteCategory: ''
        }
      };
      
      await this.createUserProfile(result.user.uid, userProfile);
      this.userProfileSubject.next(userProfile);
      
      console.log('✅ Usuario registrado exitosamente:', displayName);
      return { user: result.user, profile: userProfile };
      
    } catch (error) {
      console.error('❌ Error en registro:', error);
      throw error;
    }
  }

  async loginWithGoogle(): Promise<{ user: User; profile: UserProfile }> {
    try {
      console.log('🔐 Login con Google...');
      
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(this.auth, provider);
      
      // Verificar si ya existe el perfil
      let profile = await this.getUserProfileFromFirestore(result.user.uid);
      
      if (!profile) {
        // Crear perfil si no existe
        const names = (result.user.displayName || '').split(' ');
        const firstName = names[0] || '';
        const lastName = names.slice(1).join(' ') || '';
        
        profile = {
          uid: result.user.uid,
          email: result.user.email!,
          role: 'user',
          displayName: result.user.displayName || result.user.email!,
          firstName: firstName,
          lastName: lastName,
          profileImage: result.user.photoURL || '',
          isActive: true,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          lastLogin: serverTimestamp(),
          preferences: {
            notifications: true,
            newsletter: true,
            theme: 'auto'
          },
          stats: {
            totalOrders: 0,
            totalSpent: 0,
            favoriteCategory: ''
          }
        };
        
        await this.createUserProfile(result.user.uid, profile);
      } else {
        await this.updateLastLogin(result.user.uid);
      }
      
      this.userProfileSubject.next(profile);
      console.log('✅ Login con Google exitoso:', profile.displayName);
      
      return { user: result.user, profile };
      
    } catch (error) {
      console.error('❌ Error en login con Google:', error);
      throw error;
    }
  }

  async resetPassword(email: string): Promise<void> {
    try {
      await sendPasswordResetEmail(this.auth, email);
      console.log('✅ Email de recuperación enviado a:', email);
    } catch (error) {
      console.error('❌ Error enviando email de recuperación:', error);
      throw error;
    }
  }

  async logout(): Promise<void> {
    try {
      console.log('🔐 Cerrando sesión...');
      await signOut(this.auth);
      this.userProfileSubject.next(null);
      console.log('✅ Sesión cerrada exitosamente');
    } catch (error) {
      console.error('❌ Error cerrando sesión:', error);
      throw error;
    }
  }

  // ============ MÉTODOS DE PERFIL ============

  async updateUserProfile(uid: string, updates: Partial<UserProfile>): Promise<void> {
    try {
      const userDoc = doc(this.firestore, 'users', uid);
      const updateData = {
        ...updates,
        updatedAt: serverTimestamp()
      };
      
      await setDoc(userDoc, updateData, { merge: true });
      
      // Actualizar el subject local
      const currentProfile = this.userProfileSubject.value;
      if (currentProfile && currentProfile.uid === uid) {
        this.userProfileSubject.next({ ...currentProfile, ...updateData });
      }
      
      console.log('✅ Perfil actualizado para:', uid);
    } catch (error) {
      console.error('❌ Error actualizando perfil:', error);
      throw error;
    }
  }

  async makeUserAdmin(uid: string): Promise<void> {
    if (!this.isAdmin()) {
      throw new Error('Solo administradores pueden promover usuarios');
    }
    
    await this.updateUserProfile(uid, { role: 'admin' });
    console.log('✅ Usuario promovido a admin:', uid);
  }

  async updateUserStats(uid: string, orderTotal: number): Promise<void> {
    try {
      const profile = await this.getUserProfileFromFirestore(uid);
      if (profile && profile.stats) {
        const newStats = {
          totalOrders: profile.stats.totalOrders + 1,
          totalSpent: profile.stats.totalSpent + orderTotal,
          favoriteCategory: profile.stats.favoriteCategory // Lógica para actualizar esto
        };
        
        await this.updateUserProfile(uid, { stats: newStats });
      }
    } catch (error) {
      console.error('❌ Error actualizando estadísticas:', error);
    }
  }

  // ============ MÉTODOS DE CONSULTA ============

  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  getUserProfile(): UserProfile | null {
    return this.userProfileSubject.value;
  }

  isLoggedIn(): boolean {
    return this.currentUserSubject.value !== null;
  }

  isAdmin(): boolean {
    const profile = this.userProfileSubject.value;
    return profile?.role === 'admin' || false;
  }

  isUser(): boolean {
    const profile = this.userProfileSubject.value;
    return profile?.role === 'user' || false;
  }

  getUserDisplayName(): string {
    const profile = this.userProfileSubject.value;
    if (!profile) return 'Usuario';
    
    return profile.displayName || 
           (profile.firstName && profile.lastName ? `${profile.firstName} ${profile.lastName}` : '') ||
           profile.firstName ||
           profile.email || 
           'Usuario';
  }

  getUserInitials(): string {
    const profile = this.userProfileSubject.value;
    if (!profile) return 'U';
    
    if (profile.firstName && profile.lastName) {
      return `${profile.firstName[0]}${profile.lastName[0]}`.toUpperCase();
    }
    
    if (profile.displayName) {
      const names = profile.displayName.split(' ').filter(name => name.trim());
      if (names.length > 1) {
        return `${names[0][0]}${names[1][0]}`.toUpperCase();
      } else if (names.length === 1 && names[0].length > 0) {
        return names[0][0].toUpperCase();
      }
    }
    
    if (profile.email && profile.email.length > 0) {
      return profile.email[0].toUpperCase();
    }
    
    return 'U';
  }

  // ============ MÉTODOS PRIVADOS ============

  private async createUserProfile(uid: string, profile: UserProfile): Promise<void> {
    try {
      const userDoc = doc(this.firestore, 'users', uid);
      await setDoc(userDoc, profile);
      console.log('✅ Perfil creado en Firestore:', uid);
    } catch (error) {
      console.error('❌ Error creando perfil:', error);
      throw error;
    }
  }

  private async getUserProfileFromFirestore(uid: string): Promise<UserProfile | null> {
    try {
      const userDoc = doc(this.firestore, 'users', uid);
      const docSnap = await getDoc(userDoc);
      
      if (docSnap.exists()) {
        const data = docSnap.data() as UserProfile;
        console.log('✅ Perfil cargado desde Firestore:', data.displayName);
        return data;
      }
      
      console.log('⚠️ Perfil no encontrado en Firestore:', uid);
      return null;
    } catch (error) {
      console.error('❌ Error obteniendo perfil:', error);
      return null;
    }
  }

  private async loadUserProfile(uid: string): Promise<UserProfile | null> {
    const profile = await this.getUserProfileFromFirestore(uid);
    this.userProfileSubject.next(profile);
    return profile;
  }

  private async updateLastLogin(uid: string): Promise<void> {
    try {
      const userDoc = doc(this.firestore, 'users', uid);
      await setDoc(userDoc, { 
        lastLogin: serverTimestamp(),
        updatedAt: serverTimestamp()
      }, { merge: true });
    } catch (error) {
      console.error('❌ Error actualizando último login:', error);
    }
  }

  // ============ MÉTODOS DE UTILIDAD Y DEBUG ============

  /**
   * Resetea completamente el estado de autenticación
   * Útil para resolver bucles infinitos o estados inconsistentes
   */
  async forceReset(): Promise<void> {
    try {
      console.log('🔄 AuthService: Reseteando estado de autenticación...');
      
      // Limpiar observables
      this.currentUserSubject.next(null);
      this.userProfileSubject.next(null);
      
      // Cerrar sesión en Firebase
      await signOut(this.auth);
      
      // Limpiar cualquier storage local si existe
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem('user_profile');
        localStorage.removeItem('auth_state');
      }
      
      console.log('✅ AuthService: Estado reseteado completamente');
    } catch (error) {
      console.error('❌ Error reseteando estado:', error);
    }
  }

  /**
   * Información de debug del estado actual
   */
  getDebugInfo(): any {
    return {
      currentUser: this.currentUserSubject.value ? {
        uid: this.currentUserSubject.value.uid,
        email: this.currentUserSubject.value.email,
        displayName: this.currentUserSubject.value.displayName
      } : null,
      userProfile: this.userProfileSubject.value,
      isLoggedIn: this.isLoggedIn(),
      isAdmin: this.isAdmin(),
      timestamp: new Date().toISOString()
    };
  }

  // ============ MANEJO DE ERRORES ============

  getErrorMessage(error: any): string {
    const errorMessages: { [key: string]: string } = {
      'auth/invalid-email': 'Correo electrónico inválido.',
      'auth/user-disabled': 'Esta cuenta ha sido deshabilitada.',
      'auth/user-not-found': 'No existe una cuenta con este correo.',
      'auth/wrong-password': 'Contraseña incorrecta.',
      'auth/email-already-in-use': 'Este correo ya está registrado.',
      'auth/weak-password': 'La contraseña debe tener al menos 6 caracteres.',
      'auth/network-request-failed': 'Error de conexión. Verifica tu internet.',
      'auth/too-many-requests': 'Demasiados intentos. Inténtalo más tarde.',
      'auth/popup-closed-by-user': 'Proceso cancelado por el usuario.',
      'auth/cancelled-popup-request': 'Proceso cancelado.',
      'auth/popup-blocked': 'Popup bloqueado por el navegador.'
    };

    return errorMessages[error.code] || `Error: ${error.message}`;
  }
}