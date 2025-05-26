import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { AuthService } from '../../servicios/auth.service';
import { HttpClient } from '@angular/common/http';
import { catchError, of } from 'rxjs';
import { ImageService } from '../../servicios/image.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
@Component({
  selector: 'app-listar-partidas',
  imports: [CommonModule, RouterModule, FormsModule, MatButtonModule,
    MatIconModule,
    MatTooltipModule,
  MatProgressSpinner],
  templateUrl: './listar-partidas.component.html',
  styleUrl: './listar-partidas.component.css'
})
export class ListarPartidasComponent {
  partidas: any[] = [];
  partidasPaginadas: any[] = [];
  paginaActual: number = 1;
  totalPaginas: number = 1;
  totalPartidas: number = 1;
  itemsPorPagina: number = 5;
  cargando: boolean = false;
  errorcarga: string | null = null;
  constructor(private authservice: AuthService, private http: HttpClient, private imgService:ImageService, private snackbar: MatSnackBar) { }
  ngOnInit(): void {

     if (!this.authservice.estaAutenticado() || this.authservice.getDatosUsuario().rol !== 'admin') {
      this.errorcarga = "debes ser administrador para acceder a esta sección";
      this.cargando= false;
      return;
    }
  
    this.cargarPartida()
  }
  cargarPartida() {
    this.cargando = true;
    this.errorcarga = null;
    console.log(this.authservice.getDatosUsuario().rol)
    this.http.get<any>(`http://localhost:80/api/partidas/admin`, {
      headers: {
        'Authorization': `Bearer ${this.authservice.obtenerToken()}`
      }
    })
      .pipe(
        catchError(error => {
          this.errorcarga = 'Error al cargar las partidas. Inténtalo de nuevo más tarde.';
          this.cargando = false;
          console.error('Error al cargar partidas:', error);
          return of({ success: false, data: [] });
        })
      )
      .subscribe(respuesta => {

        this.partidas = respuesta;
        console.log(this.partidas)
        this.totalPartidas = this.partidas.length;
        this.totalPaginas = Math.ceil(this.totalPartidas / this.itemsPorPagina);

        if (this.paginaActual > this.totalPaginas && this.totalPaginas > 0) {
          this.paginaActual = this.totalPaginas;
        } else if (this.totalPaginas === 0) {
          this.paginaActual = 1;
        }
        this.actualizarPartidasPaginadas();
        this.cargando = false;
      });
  }
  actualizarPartidasPaginadas() {
    const inicio = (this.paginaActual - 1) * this.itemsPorPagina;
    const fin = inicio + this.itemsPorPagina;
    this.partidasPaginadas = this.partidas.slice(inicio, fin);
  }
  cambiarPagina(nuevaPagina: number) {
    if (nuevaPagina >= 1 && nuevaPagina <= this.totalPaginas) {
      this.paginaActual = nuevaPagina;
        this.actualizarPartidasPaginadas();
    }
  }

  eliminarPartida(event:Event,id_partida: any) {
    event.stopPropagation();
    if (confirm('¿Estás seguro de eliminar este partida?(esto es irreversible)')) {
      this.http.delete(`http://localhost:80/api/partidas/${id_partida}`, {
        headers: {
 'Authorization': `Bearer ${this.authservice.obtenerToken()}`
    }}).pipe(
    catchError(error => {
      this.snackbar.open('Error al eliminar la partida. Inténtalo de nuevo más tarde.');
      this.cargando = false;
      console.error('Error al eliminar la partida:', error);
      return of({ success: false, data: [] });
    })
  )
  .subscribe((respuesta: any) => {
      if (respuesta?.message) {
    this.snackbar.open(respuesta.message, 'Cerrar', { duration: 3000 });
this.cargarPartida();
  }
  });
  }
}
  cambiarEstado(event:Event,id_partida: any) {
    event.stopPropagation();
     this.http.put(`http://localhost:80/api/partidas/${id_partida}/estado`,{}, {
        headers: {
 'Authorization': `Bearer ${this.authservice.obtenerToken()}`
    }}).pipe(
    catchError(error => {
      this.snackbar.open('Error al cambiar el estado. Inténtalo de nuevo más tarde.');
      this.cargando = false;
      console.error('Error al eliminar la partida:', error);
      return of({ success: false, data: [] });
    })
  )
  .subscribe((respuesta: any) => {
      if (respuesta?.message) {
    this.snackbar.open(respuesta.message, 'Cerrar', { duration: 3000 });
    this.cargarPartida();
  }
  });
  }
    getPortada(imagen:string){
    return this.imgService.getPortadaImagenUrl(imagen);
  }
  getPerfil(imagen:string){
    return this.imgService.getUsuarioImagenUrl(imagen);
  }
  cerrarAlerta() {
    this.errorcarga=null;
  }
}