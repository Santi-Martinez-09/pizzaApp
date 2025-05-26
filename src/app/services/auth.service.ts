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
  User
} from '@angular/fire/auth';
import { Firestore, doc, setDoc, getDoc } from '@angular/fire/firestore';
import { Observable } from 'rxjs';

export interface UserProfile {
  uid: string;
  email: string;
  role: 'admin' | 'user';
  displayName?: string;
  createdAt: Date;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  currentUser: User | null = null;
  userProfile: UserProfile | null = null;

  constructor(
    private auth: Auth,
    private firestore: Firestore
  ) {
    onAuthStateChanged(this.auth, async (user) => {
      this.currentUser = user;
      if (user) {
        await this.loadUserProfile(user.uid);
      } else {
        this.userProfile = null;
      }
    });
  }

  async login(email: string, password: string) {
    const result = await signInWithEmailAndPassword(this.auth, email, password);
    await this.loadUserProfile(result.user.uid);
    return result;
  }

  async register(email: string, password: string) {
    const result = await createUserWithEmailAndPassword(this.auth, email, password);
    
    // Crear perfil de usuario (por defecto es 'user', solo el primer usuario será 'admin')
    const userProfile: UserProfile = {
      uid: result.user.uid,
      email: result.user.email!,
      role: 'user', // Por defecto todos son usuarios
      displayName: result.user.displayName || '',
      createdAt: new Date()
    };

    await this.createUserProfile(result.user.uid, userProfile);
    this.userProfile = userProfile;
    
    return result;
  }

  async loginWithGoogle() {
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(this.auth, provider);
    
    // Verificar si ya existe el perfil
    const existingProfile = await this.getUserProfileFromFirestore(result.user.uid);
    if (!existingProfile) {
      const userProfile: UserProfile = {
        uid: result.user.uid,
        email: result.user.email!,
        role: 'user',
        displayName: result.user.displayName || '',
        createdAt: new Date()
      };
      await this.createUserProfile(result.user.uid, userProfile);
    }
    
    await this.loadUserProfile(result.user.uid);
    return result;
  }

  async resetPassword(email: string) {
    return await sendPasswordResetEmail(this.auth, email);
  }

  async logout() {
    this.userProfile = null;
    return await signOut(this.auth);
  }

  isLoggedIn(): boolean {
    return this.currentUser !== null;
  }

  getCurrentUser(): User | null {
    return this.currentUser;
  }

  getUserProfile(): UserProfile | null {
    return this.userProfile;
  }

  isAdmin(): boolean {
    return this.userProfile?.role === 'admin';
  }

  isUser(): boolean {
    return this.userProfile?.role === 'user';
  }

  private async createUserProfile(uid: string, profile: UserProfile) {
    const userDoc = doc(this.firestore, 'users', uid);
    await setDoc(userDoc, profile);
  }

  private async getUserProfileFromFirestore(uid: string): Promise<UserProfile | null> {
    const userDoc = doc(this.firestore, 'users', uid);
    const docSnap = await getDoc(userDoc);
    
    if (docSnap.exists()) {
      return docSnap.data() as UserProfile;
    }
    return null;
  }

  private async loadUserProfile(uid: string) {
    this.userProfile = await this.getUserProfileFromFirestore(uid);
  }

  // Método para hacer admin a un usuario (solo para testing)
  async makeUserAdmin(uid: string) {
    if (this.isAdmin()) {
      const userDoc = doc(this.firestore, 'users', uid);
      await setDoc(userDoc, { role: 'admin' }, { merge: true });
    }
  }

  getErrorMessage(error: any): string {
    switch (error.code) {
      case 'auth/invalid-email':
        return 'Correo electrónico inválido.';
      case 'auth/user-disabled':
        return 'Usuario deshabilitado.';
      case 'auth/user-not-found':
        return 'Usuario no encontrado.';
      case 'auth/wrong-password':
        return 'Contraseña incorrecta.';
      case 'auth/email-already-in-use':
        return 'El correo electrónico ya está en uso.';
      case 'auth/weak-password':
        return 'Contraseña débil. Debe tener al menos 6 caracteres.';
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