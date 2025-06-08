
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { AuthService } from '../../servicios/auth.service';
import { catchError, of } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
@Component({
  selector: 'app-listar-categorias',
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './listar-categorias.component.html',
  styleUrl: './listar-categorias.component.css'
})
export class ListarCategoriasComponent {

 categorias: any[] = [];
  categoriasPaginados: any[] = [];
  paginaActual: number = 1;
  totalPaginas: number = 1;
  totalcategorias: number = 1;
  itemsPorPagina: number = 10;
  cargando: boolean = false;
  errorcarga: string | null = null;
  constructor(private authservice: AuthService, private http: HttpClient, private snackbar:MatSnackBar) { }
  ngOnInit(): void {
     if (!this.authservice.estaAutenticado() || this.authservice.getDatosUsuario().rol !== 'admin') {
      this.errorcarga = "debes ser administrador para acceder a esta sección";
      this.cargando= false;
      return;
    }
  
    this.cargarcategoria()
  }
  cargarcategoria() {
    this.cargando = true;
    this.errorcarga = null;
    this.http.get<any>(`http://localhost:80/api/categorias`)
      .pipe(
        catchError(error => {
          this.errorcarga = 'Error al cargar las categorias. Inténtalo de nuevo más tarde.';
          this.cargando = false;
          console.error('Error al cargar categorias:', error);
          return of({ success: false, data: [] });
        })
      )
      .subscribe(respuesta => {

        this.categorias = respuesta;
        this.totalcategorias = this.categorias.length;
        this.totalPaginas = Math.ceil(this.totalcategorias / this.itemsPorPagina);

        if (this.paginaActual > this.totalPaginas && this.totalPaginas > 0) {
          this.paginaActual = this.totalPaginas;
        } else if (this.totalPaginas === 0) {
          this.paginaActual = 1;
        }
        this.actualizarcategoriasPaginados();
        this.cargando = false;
      });
  }
  actualizarcategoriasPaginados() {
    const inicio = (this.paginaActual - 1) * this.itemsPorPagina;
    const fin = inicio + this.itemsPorPagina;
    this.categoriasPaginados = this.categorias.slice(inicio, fin);
  }
  cambiarPagina(nuevaPagina: number) {
    if (nuevaPagina >= 1 && nuevaPagina <= this.totalPaginas) {
      this.paginaActual = nuevaPagina;
        this.actualizarcategoriasPaginados();
    }
  }
  cerrarAlerta() {
    this.errorcarga=null;
  }
  eliminarCategoria(id: any,event: MouseEvent) {

  if(confirm('¿Estás seguro de eliminar esta categoria?(esta accion sera irreversible)')){
    event.stopPropagation();
      this.http.delete(`http://localhost:80/api/categorias/${id}`, {
        headers: {
 'Authorization': `Bearer ${this.authservice.obtenerToken()}`
    }}).pipe(
    catchError(error => {
      let errorMessage = error.error?.error || 'Error al eliminar la categoría';
      this.snackbar.open(errorMessage, 'Cerrar', { duration: 3000 });
      console.error('Error al eliminar la partida:', error);
      return of({ success: false, data: [] });
    })
  )
  .subscribe((respuesta: any) => {
      if (respuesta?.message) {
    this.snackbar.open(respuesta.message, 'Cerrar', { duration: 3000 });
    this.cargarcategoria();
  }
  });
  }
}
}
