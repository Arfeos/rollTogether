import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatListModule } from '@angular/material/list';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../servicios/auth.service';
import { catchError, of } from 'rxjs';
import { ImageService } from '../../servicios/image.service';
import { MatSnackBar } from '@angular/material/snack-bar';
@Component({
  selector: 'app-mis-partidas',
  imports: [CommonModule,
    FormsModule,
    MatButtonModule,
    MatInputModule,
    MatFormFieldModule,
    MatSidenavModule,
    MatListModule,
    MatIconModule,
    RouterModule,
    MatTooltipModule,
    MatProgressSpinnerModule],
  templateUrl: './mis-partidas.component.html',
  styleUrl: './mis-partidas.component.css'
})
export class MisPartidasComponent {
  esMiPerfil: boolean = true;
  esAdmin: boolean = false;
  cargando: boolean = false;
  id!: number;
  errorCarga: string | null = null;
  menuAbierto: boolean = false;
  nombreArchivoImagen: string | null = null;
 partidasPaginadas:any[]=[];

  partidas: any[] = [];
  paginaActual: number = 1;
  totalPaginas: number = 1;
  totalPartidas: number=0;
   itemsPorPagina=5
    constructor(
    private authservice: AuthService, private http: HttpClient,private imgService:ImageService ,private router:Router,private snackbar:MatSnackBar) { }
  ngOnInit(): void {

      if (!this.authservice.estaAutenticado()) {
      this.errorCarga = "debes iniciar sesión para ver tus partidas";
      this.cargando= false;
      return;
    }
    this.id = this.authservice.getDatosUsuario().sub;
    this.cargarPartidas()
    this.esAdmin= this.authservice.getDatosUsuario().rol=='admin';

  }
  cargarPartidas() {
  this.cargando = true;
  this.errorCarga = null;

  this.http.get<any>(`http://localhost:80/api/usuarios/${this.id}/partidas`, {
    headers: {
      'Authorization': `Bearer ${this.authservice.obtenerToken()}`
    }
  })
  .pipe(
    catchError(error => {
      this.errorCarga = 'Error al cargar las partidas. Inténtalo de nuevo más tarde.';
      this.cargando = false;
      console.error('Error al cargar partidas:', error);
      return of({ success: false, data: [] });
    })
  )
  .subscribe(respuesta => {
    if (respuesta.success) {
      this.partidas = respuesta.data;
    } else {
      this.errorCarga = 'No se pudieron cargar las partidas.';
    }
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
   eliminarPartida(event:Event,id_partida: any) {
    event.stopPropagation();
    if (confirm('¿Estás seguro de eliminar este partida?(esto es irreversible)')) {
      this.http.delete(`http://localhost:80/api/partidas/${id_partida}`, {
        headers: {
 'Authorization': `Bearer ${this.authservice.obtenerToken()}`
    }}).pipe(
    catchError(error => {
      this.errorCarga = 'Error al cargar las partidas. Inténtalo de nuevo más tarde.';
      this.cargando = false;
      console.error('Error al eliminar la partida:', error);
      return of({ success: false, data: [] });
    })
  )
  .subscribe((respuesta: any) => {
      if (respuesta?.message) {
    this.snackbar.open(respuesta.message, 'Cerrar', { duration: 3000 });
this.cargarPartidas();
  }
  });
  }
}
  cambiarEstado(id_partida: any, event: Event) {
    event.stopPropagation();
      this.http.put(`http://localhost:80/api/partidas/${id_partida}/estado`,{}, {
        headers: {
 'Authorization': `Bearer ${this.authservice.obtenerToken()}`
    }}).pipe(
    catchError(error => {
      this.snackbar.open(error.error.error, 'Cerrar', { duration: 3000 });
      this.cargando = false;
      console.error('Error al eliminar la partida:', error);
      return of({ success: false, data: [] });
    })
  )
  .subscribe((respuesta: any) => {
      if (respuesta?.message) {
    this.snackbar.open(respuesta.message, 'Cerrar', { duration: 3000 });
    this.cargarPartidas();
  }
  });
  }

  cambiarPagina(nuevaPagina: number) {
    if (nuevaPagina >= 1 && nuevaPagina <= this.totalPaginas) {
      this.paginaActual = nuevaPagina;
        this.actualizarPartidasPaginadas();
    }
  }
  actualizarPartidasPaginadas() {
  const inicio = (this.paginaActual - 1) * this.itemsPorPagina;
    const fin = inicio + this.itemsPorPagina;
    this.partidasPaginadas = this.partidas.slice(inicio, fin);
  }
  cerrarSesion() {
    this.authservice.logout();
  }
  toggleMenu() {
    this.menuAbierto = !this.menuAbierto;
  }

  cerrarAlerta() {
    this.errorCarga = null;
  }
  getPortada(imagen:string){
    return this.imgService.getPortadaImagenUrl(imagen);
  }
  getPerfil(imagen:string){
    return this.imgService.getUsuarioImagenUrl(imagen);
  }
}