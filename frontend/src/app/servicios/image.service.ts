  import { Injectable } from '@angular/core';


@Injectable({
  providedIn: 'root'
})
export class ImageService {
  getUsuarioImagenUrl(nombre: string): string {
    return `http://localhost:80/foto/usuarios/${nombre}`;
  }
  getPortadaImagenUrl(nombre: string): string {
    return `http://localhost:80/foto/partidas/${nombre}`;
  }
}