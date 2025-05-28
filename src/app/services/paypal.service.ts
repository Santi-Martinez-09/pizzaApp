import { Injectable } from '@angular/core';

declare var paypal: any;

export interface PayPalSDKConfig {
  clientId: string;
  currency: string;
  intent: string;
  locale: string;
}

@Injectable({
  providedIn: 'root'
})
export class PayPalLoaderService {
  private sdkLoaded = false;
  private sdkLoading = false;
  private loadPromise: Promise<boolean> | null = null;

  private config: PayPalSDKConfig = {
    clientId: 'AbqotKe77My2Q-CA91Yar4U1ODuwWAUqZ_zpi_GZb0P5M7j5JhGu8u65XlWHC3Iq86C2IvNk0lkrwFoe',
    currency: 'USD',
    intent: 'capture',
    locale: 'es_ES'
  };

  constructor() {
    console.log('🔧 PayPalLoaderService: Inicializado');
  }

  // Verificar si PayPal ya está disponible
  isLoaded(): boolean {
    const available = typeof paypal !== 'undefined' && paypal && paypal.Buttons;
    console.log('PayPal disponible:', available);
    return available;
  }

  // Cargar SDK de PayPal dinámicamente
  async loadSDK(): Promise<boolean> {
    console.log('🔄 Iniciando carga de PayPal SDK...');

    // Si ya está cargado, retornar true
    if (this.isLoaded()) {
      console.log('✅ PayPal ya está cargado');
      return true;
    }

    // Si ya está en proceso de carga, esperar
    if (this.loadPromise) {
      console.log('⏳ Esperando carga en progreso...');
      return this.loadPromise;
    }

    // Iniciar nueva carga
    this.loadPromise = this.doLoadSDK();
    return this.loadPromise;
  }

  private async doLoadSDK(): Promise<boolean> {
    return new Promise((resolve, reject) => {
      try {
        console.log('📡 Creando script de PayPal...');

        // Remover script existente si hay uno
        const existingScript = document.getElementById('paypal-sdk');
        if (existingScript) {
          console.log('🗑️ Removiendo script existente');
          existingScript.remove();
        }

        // Crear nuevo script
        const script = document.createElement('script');
        script.id = 'paypal-sdk';
        script.src = this.getSDKUrl();
        script.async = true;
        script.defer = true;

        console.log('🌐 URL del SDK:', script.src);

        // Variable para manejar timeout
        let timeoutId: any = null;

        script.onload = () => {
          console.log('✅ Script de PayPal cargado exitosamente');
          
          // Limpiar timeout
          if (timeoutId) {
            clearTimeout(timeoutId);
          }
          
          // Verificar que PayPal esté disponible
          setTimeout(() => {
            if (this.isLoaded()) {
              this.sdkLoaded = true;
              this.sdkLoading = false;
              console.log('🎉 PayPal SDK completamente disponible');
              resolve(true);
            } else {
              console.error('❌ PayPal script cargado pero SDK no disponible');
              reject(new Error('PayPal SDK no disponible después de cargar'));
            }
          }, 500);
        };

        script.onerror = (error) => {
          console.error('❌ Error cargando script de PayPal:', error);
          this.sdkLoading = false;
          
          // Limpiar timeout
          if (timeoutId) {
            clearTimeout(timeoutId);
          }
          
          reject(new Error('Error cargando PayPal SDK'));
        };

        // Agregar script al DOM
        this.sdkLoading = true;
        document.head.appendChild(script);
        console.log('📝 Script agregado al DOM');

        // Timeout de seguridad (30 segundos)
        timeoutId = setTimeout(() => {
          if (this.sdkLoading) {
            console.error('⏰ Timeout: PayPal SDK no se cargó en 30 segundos');
            this.sdkLoading = false;
            
            // Remover script si hay timeout
            if (script.parentNode) {
              script.parentNode.removeChild(script);
            }
            
            reject(new Error('Timeout cargando PayPal SDK'));
          }
        }, 30000);

      } catch (error) {
        console.error('💥 Error inesperado cargando PayPal:', error);
        this.sdkLoading = false;
        reject(error);
      }
    });
  }

  private getSDKUrl(): string {
    const params = new URLSearchParams({
      'client-id': this.config.clientId,
      'currency': this.config.currency,
      'intent': this.config.intent,
      'locale': this.config.locale,
      'disable-funding': 'credit,card', // Solo PayPal, sin tarjetas
      'enable-funding': 'venmo'
    });

    return `https://www.paypal.com/sdk/js?${params.toString()}`;
  }

  // Obtener instancia de PayPal
  getPayPal(): any {
    if (this.isLoaded()) {
      return paypal;
    }
    throw new Error('PayPal SDK no está cargado');
  }

  // Información de debug
  getDebugInfo(): any {
    return {
      sdkLoaded: this.sdkLoaded,
      sdkLoading: this.sdkLoading,
      isAvailable: this.isLoaded(),
      config: this.config,
      sdkUrl: this.getSDKUrl(),
      userAgent: navigator.userAgent,
      location: window.location.href,
      timestamp: new Date().toISOString(),
      paypalObject: typeof paypal !== 'undefined' ? {
        version: paypal.version || 'unknown',
        buttons: typeof paypal.Buttons === 'function'
      } : null
    };
  }

  // Test de conectividad
  async testConnectivity(): Promise<{ success: boolean; message: string; details?: any }> {
    console.log('🧪 Iniciando test de conectividad PayPal...');

    try {
      // Test 1: Verificar conectividad básica
      const response = await fetch('https://www.paypal.com/sdk/js', { 
        method: 'HEAD',
        mode: 'no-cors'
      });
      console.log('✅ Test 1: Conectividad básica OK');

      // Test 2: Intentar cargar SDK
      const sdkLoaded = await this.loadSDK();
      if (!sdkLoaded) {
        return {
          success: false,
          message: 'SDK no se pudo cargar',
          details: this.getDebugInfo()
        };
      }
      console.log('✅ Test 2: SDK cargado OK');

      // Test 3: Verificar funcionalidad
      const pp = this.getPayPal();
      if (!pp.Buttons) {
        return {
          success: false,
          message: 'PayPal.Buttons no disponible',
          details: this.getDebugInfo()
        };
      }
      console.log('✅ Test 3: PayPal.Buttons OK');

      return {
        success: true,
        message: 'PayPal completamente funcional',
        details: this.getDebugInfo()
      };

    } catch (error) {
      console.error('❌ Error en test de conectividad:', error);
      return {
        success: false,
        message: `Error: ${error}`,
        details: this.getDebugInfo()
      };
    }
  }

  // Limpiar y reiniciar
  reset(): void {
    console.log('🔄 Reiniciando PayPal Loader...');
    
    this.sdkLoaded = false;
    this.sdkLoading = false;
    this.loadPromise = null;

    // Remover script existente
    const existingScript = document.getElementById('paypal-sdk');
    if (existingScript) {
      existingScript.remove();
      console.log('🗑️ Script removido');
    }

    // Limpiar variable global
    if (typeof window !== 'undefined' && (window as any).paypal) {
      delete (window as any).paypal;
      console.log('🗑️ Variable global limpiada');
    }
  }
}