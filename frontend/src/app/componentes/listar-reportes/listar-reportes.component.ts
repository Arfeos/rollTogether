import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { AuthService } from '../../servicios/auth.service';
import { HttpClient } from '@angular/common/http';
import { catchError, of } from 'rxjs';
import { ImageService } from '../../servicios/image.service';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
@Component({
  selector: 'app-listar-reportes',
  imports: [    
    CommonModule,
    RouterModule,
    FormsModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatProgressSpinner],
  templateUrl: './listar-reportes.component.html',
  styleUrl: './listar-reportes.component.css'
})
export class ListarReportesComponent {
  reportes: any[] = [];
  reportesPaginados: any[] = [];
  paginaActual: number = 1;
  totalPaginas: number = 1;
  totalreportes: number = 1;
  itemsPorPagina: number = 5;
  cargando: boolean = false;
  errorcarga: string | null = null;
  constructor(private authservice: AuthService, private http: HttpClient, private imgService:ImageService) { }
  ngOnInit(): void {
     if (!this.authservice.estaAutenticado() || this.authservice.getDatosUsuario().rol !== 'admin') {
      this.errorcarga = "debes ser administrador para acceder a esta sección";
      this.cargando= false;
      return;
    }
  
    this.cargarreporte()
  }
  cargarreporte() {
    this.cargando = true;
    this.errorcarga = null;
    this.http.get<any>(`http://localhost:80/api/reportes`, {
      headers: {
        'Authorization': `Bearer ${this.authservice.obtenerToken()}`
      }
    })
      .pipe(
        catchError(error => {
          this.errorcarga = 'Error al cargar las reportes. Inténtalo de nuevo más tarde.';
          this.cargando = false;
          console.error('Error al cargar reportes:', error);
          return of({ success: false, data: [] });
        })
      )
      .subscribe(respuesta => {

        this.reportes = respuesta;
        this.totalreportes = this.reportes.length;
        this.totalPaginas = Math.ceil(this.totalreportes / this.itemsPorPagina);

        if (this.paginaActual > this.totalPaginas && this.totalPaginas > 0) {
          this.paginaActual = this.totalPaginas;
        } else if (this.totalPaginas === 0) {
          this.paginaActual = 1;
        }
        this.actualizarreportesPaginados();
        this.cargando = false;
      });
  }
  actualizarreportesPaginados() {
    const inicio = (this.paginaActual - 1) * this.itemsPorPagina;
    const fin = inicio + this.itemsPorPagina;
    this.reportesPaginados = this.reportes.slice(inicio, fin);
  }
  cambiarPagina(nuevaPagina: number) {
    if (nuevaPagina >= 1 && nuevaPagina <= this.totalPaginas) {
      this.paginaActual = nuevaPagina;
        this.actualizarreportesPaginados();
    }
  }
  cerrarAlerta() {
    this.errorcarga=null;
  }
}
