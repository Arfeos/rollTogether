
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
import { ImageService } from '../../servicios/image.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';


@Component({
  selector: 'app-listar-usuarios',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './listar-usuarios.component.html',
  styleUrls: ['./listar-usuarios.component.css']
})
export class ListarUsuariosComponent implements OnInit {
    esMiPerfil: boolean = true;
  esAdmin: boolean = false;
  cargando: boolean = false;
  id!: number;
  errorCarga: string | null = null;
  usuarios: any[] = [];
  paginaActual: number = 1;
  totalPaginas: number = 1;
  totalusuarios: number=0;
  usuariosPaginados:any[]=[];
   itemsPorPagina=10;
constructor(private authservice: AuthService,private http:HttpClient,private imgService:ImageService , private snackbar:MatSnackBar){}
eliminarUsuario(id_usuario: any, event:Event) {
  if(confirm('¿Estás seguro de eliminar este usuario?(esta accion sera irreversible)')){
    event.stopPropagation();
      this.http.delete(`http://localhost:80/api/usuarios/${id_usuario}`, {
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
    this.actualizarDatosPagina();
  }
  });
  }
  
}
cambiarPagina(nuevaPagina: number) {
    if (nuevaPagina >= 1 && nuevaPagina <= this.totalPaginas) {
      this.paginaActual = nuevaPagina;
    }
    this.actualizarUsuariosPagina();
  }
  actualizarUsuariosPagina() {
    const inicio = (this.paginaActual - 1) * this.itemsPorPagina;
    const fin = inicio + this.itemsPorPagina;
    this.usuariosPaginados = this.usuarios.slice(inicio, fin);
  }
cambiarEstado(id_usuario: any, event: Event) {
 event.stopPropagation();
      this.http.put(`http://localhost:80/api/usuarios/${id_usuario}/estado`,{}, {
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
    this.actualizarDatosPagina();
  }
  });
}
   
  

  ngOnInit(): void {
     if (!this.authservice.estaAutenticado() || this.authservice.getDatosUsuario().rol !== 'admin') {
      this.errorCarga = "debes ser administrador para acceder a esta sección";
      this.cargando= false;
      return;
    }
    this.actualizarDatosPagina();
  }

actualizarDatosPagina(): void {
      this.cargando = true;
          this.errorCarga = null;
          this.http.get<any>(`http://localhost:80/api/usuarios`, {
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
              console.log(this.usuarios);
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


  getPerfil(imagen:string){
    return this.imgService.getUsuarioImagenUrl(imagen);
  }
cerrarAlerta() {
    this.errorCarga=null;
  }
}