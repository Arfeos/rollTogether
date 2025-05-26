import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatListModule } from '@angular/material/list';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { AuthService } from '../../servicios/auth.service';
import { HttpClient } from '@angular/common/http';
import { catchError, of } from 'rxjs';
import { ImageService } from '../../servicios/image.service';
@Component({
  selector: 'app-partidas-inscritas',
  imports: [CommonModule,
    FormsModule,
    MatButtonModule,
    MatInputModule,
    MatFormFieldModule,
    MatSidenavModule,
    MatListModule,
    MatIconModule,
    RouterModule,
    MatProgressSpinnerModule],
  templateUrl: './partidas-inscritas.component.html',
  styleUrl: './partidas-inscritas.component.css'
})
export class PartidasInscritasComponent {
  desincribirse(id_partida: any, event: Event) {
    event.stopPropagation();
        if (this.id) {
          
      this.http.delete(`http://localhost:80/api/inscripciones/partida/${id_partida}`,{headers: {
        'Authorization': `Bearer ${this.authservice.obtenerToken()}`
      }}).subscribe({
        next: () => {
          this.cargarPartidas(this.id);
        },
        error: (err) => {
          console.error('Error al abandonar:', err);
        }
      });
    }
  }
  
  esMiPerfil: boolean = true;
  esAdmin: boolean = false;
  cargando: boolean = false;
  id!: number;
  errorCarga: string | null = null;
  menuAbierto: boolean = false;
  nombreArchivoImagen: string | null = null;
  partidas: any[] = [];
  paginaActual: number = 1;
  totalPaginas: number = 1;
  totalPartidas: number = 0;
  partidasPaginadas: any[] = [];
  itemsPorPagina = 5
  constructor(private authservice: AuthService, private route: ActivatedRoute, private http: HttpClient,private imgService: ImageService) { }
  ngOnInit(): void {
     if (!this.authservice.estaAutenticado()) {
      this.errorCarga = "debes iniciar sesión para ver tus partidas";
      this.cargando= false;
      return;
    }
    this.id = this.authservice.getDatosUsuario().sub;
    this.cargarPartidas(this.id)
    this.esAdmin= this.authservice.getDatosUsuario().rol=='admin';
  }
  cargarPartidas(id: number) {
    this.cargando = true;
    this.errorCarga = null;
    this.http.get<any>(`http://localhost:80/api/inscripciones/usuario/${id}`, {
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
        this.partidas = respuesta;
        console.log(this.partidas);
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

  cambiarPagina(nuevaPagina: number) {
    if (nuevaPagina >= 1 && nuevaPagina <= this.totalPaginas) {
      this.paginaActual = nuevaPagina;
    }
    this.actualizarPartidasPaginadas();
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
