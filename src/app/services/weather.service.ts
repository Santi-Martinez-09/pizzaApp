// src/app/services/weather.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class WeatherService {
  private apiKey = 'c936049489936cdeaa3ae63c42f161d3';  // ← Cambiar esto por la APIkey
  private apiUrl = 'https://api.openweathermap.org/data/2.5/weather';

  constructor(private http: HttpClient) {}

  obtenerClima(ciudad: string) {
    const url = `${this.apiUrl}?q=${ciudad}&appid=${this.apiKey}&units=metric&lang=es`;
    return this.http.get(url);
  }
}
