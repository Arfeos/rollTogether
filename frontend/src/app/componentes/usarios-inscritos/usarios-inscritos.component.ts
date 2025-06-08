import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../servicios/auth.service';
import { ImageService } from '../../servicios/image.service';
import { catchError, of } from 'rxjs';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
@Component({
  selector: 'app-usarios-inscritos',
  imports: [CommonModule,
    RouterModule,
    FormsModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,MatProgressSpinner],
  templateUrl: './usarios-inscritos.component.html',
  styleUrl: './usarios-inscritos.component.css'
})
export class UsariosInscritosComponent {
  esMiPerfil: boolean = true;
  esAdmin: boolean = false;
  cargando: boolean = false;
  id!: string | null;
  errorCarga: string | null = null;
  usuarios: any[] = [];
  paginaActual: number = 1;
  totalPaginas: number = 1;
  totalusuarios: number = 0;
  usuariosPaginados: any[] = [];
  itemsPorPagina = 10;
  todosUsuarios: any;

  constructor(private authservice: AuthService, private http: HttpClient, private imgService: ImageService, private route: ActivatedRoute) { }



  ngOnInit(): void {
    this.id = this.route.snapshot.paramMap.get('partida_id');
    this.actualizarDatosPagina();
  }

  actualizarDatosPagina(): void {
    this.cargando = true;
    this.errorCarga = null;
    this.http.get<any>(`http://localhost:80/api/inscripciones/partida/${this.id}`, {
      headers: {
        'Authorization': `Bearer ${this.authservice.obtenerToken()}`
      }
    })
      .pipe(
        catchError(error => {
          this.errorCarga = 'Error al cargar las usuarios. Inténtalo de nuevo más tarde.';
          this.cargando = false;
          console.error('Error al cargar usuarios:', error);
          return of({ success: false, data: [] });
        })
      )
      .subscribe(respuesta => {
        this.usuarios = respuesta;
        this.totalusuarios = this.usuarios.length;
        this.totalPaginas = Math.ceil(this.totalusuarios / this.itemsPorPagina);

        if (this.paginaActual > this.totalPaginas && this.totalPaginas > 0) {
          this.paginaActual = this.totalPaginas;
        } else if (this.totalPaginas === 0) {
          this.paginaActual = 1;
        }
        this.actualizarUsuariosPagina();
        this.cargando = false;
      });
  }

  cambiarPagina(nuevaPagina: number) {
    if (nuevaPagina >= 1 && nuevaPagina <= this.totalPaginas) {
      this.paginaActual = nuevaPagina;

    }
  }

  eliminarUsuario(id: number, event:Event): void {
    event.stopPropagation();
    if (this.id) {
      this.http.delete(`http://localhost:80/api/inscripciones/usuario/${id}/partida/${this.id}`, {
        headers: {
          'Authorization': `Bearer ${this.authservice.obtenerToken()}`
        }
      }).subscribe({
        next: () => {
          this.actualizarDatosPagina();
        },
        error: (err) => {
          console.error('Error al abandonar:', err);
        }
      });
    }
  }
  actualizarUsuariosPagina() {
    const inicio = (this.paginaActual - 1) * this.itemsPorPagina;
    const fin = inicio + this.itemsPorPagina;
    this.usuariosPaginados = this.usuarios.slice(inicio, fin);
  }
  getPerfil(imagen: string) {
    return this.imgService.getUsuarioImagenUrl(imagen);
  }
  cerrarAlerta() {
  this.errorCarga = null;
}
}

