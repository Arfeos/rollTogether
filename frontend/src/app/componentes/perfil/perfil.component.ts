import { Component, OnInit, ViewChild } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { AuthService } from '../../servicios/auth.service';
import { catchError, of, switchMap } from 'rxjs';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { ImageService } from '../../servicios/image.service';
@Component({
  selector: 'app-perfil',
  standalone: true,
  templateUrl: './perfil.component.html',
  styleUrls: ['./perfil.component.css'],
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatInputModule,
    MatFormFieldModule,
    MatSidenavModule,
    MatListModule,
    MatIconModule,
    RouterModule,
    MatProgressSpinnerModule
  ]
})
export class PerfilComponent implements OnInit {
document: any;
  cerrarSesion() {
    this.authservice.logout();
  }
  esMiPerfil: boolean = true;
  esAdmin: boolean = false;
  cargando: boolean = true;
  logueado: boolean = false;
  errorCarga: string | null = null;
  datosUsuario: any = {
  };

  @ViewChild('perfilForm') perfilForm?: NgForm;

  // Modelos para el formulario
  usuario: string = '';
  correo: string = '';
  contrasena: string = '';
  biografia: string = '';
  menuAbierto: boolean = false;
  nombreArchivoImagen: string | null = null;
  imagenPerfil: string | ArrayBuffer | null = null;
  errorImagen: string | null = null;
  archivoSeleccionado: File | null = null;

  constructor(
    private modalService: NgbModal,
    private snackBar: MatSnackBar, private authservice: AuthService, private http: HttpClient, private route: ActivatedRoute, private imgService: ImageService
  ) { }

  ngOnInit(): void {
    this.cargarDatosUsuario();
  }

  cargarDatosUsuario() {
    this.logueado = this.authservice.estaAutenticado();
    this.cargando = true;
    const datos = this.authservice.getDatosUsuario();
    const id = this.route.snapshot.paramMap.get('id_perfil');
    const token = this.authservice.obtenerToken();
    this.http.get<any[]>('http://localhost:80/api/usuarios/' + id, {
      headers: new HttpHeaders({
        'Authorization': `Bearer ${token}`
      })
    }

    )
      .pipe(
        catchError(error => {
          this.errorCarga = 'Error al cargar el usuario.';
          this.cargando = false;
          console.error('Error al cargar partidas:', error);
          return of([]);
        })
      )
      .subscribe(usuario => {
        this.cargando = false;
        if (usuario) {
          this.datosUsuario = usuario
        }
        this.usuario = this.datosUsuario.nombre;
        this.correo = this.datosUsuario.email;
        this.biografia = this.datosUsuario.bio;

        this.esMiPerfil = this.datosUsuario.id == datos.sub;
        this.esAdmin = datos.rol == 'admin';
        this.imagenPerfil = this.imgService.getUsuarioImagenUrl(this.datosUsuario.foto_perfil);

      })
  }
  abrirModal(contenido: any) {
    if (!this.esMiPerfil) return;
    this.errorImagen = null;
    this.modalService.open(contenido);
  }


  onArchivoSeleccionado(event: any) {
    if (!this.esMiPerfil) return;

    const archivo: File = event.target.files[0];
    if (archivo) {
      const tiposPermitidos = ['image/jpeg', 'image/png', 'image/gif'];
      if (!tiposPermitidos.includes(archivo.type)) {
        this.errorImagen = 'Solo se permiten imágenes JPEG, PNG o GIF';
        return;
      }
      if (archivo.size > 5 * 1024 * 1024) {
        this.errorImagen = 'La imagen no puede superar los 5MB';
        return;
      }

      this.archivoSeleccionado = archivo;
      this.errorImagen = null;

      const reader = new FileReader();
      reader.onload = () => {
        this.imagenPerfil = reader.result;

      };
    }
  }

  actualizarPerfil() {
    if (this.perfilForm?.valid && (this.esMiPerfil || this.esAdmin)) {
      this.cargando = true;
      this.errorCarga = null;

      const token = this.authservice.obtenerToken();
      if (!token) {
        this.cargando = false;
        this.errorCarga = 'No estás autenticado';
        return;
      }

      const datos: any = {
        nombre: this.usuario,
        email: this.correo,
        bio: this.biografia || ''
      };

      if (this.contrasena) {
        datos.password = this.contrasena;
      }

      const headers = new HttpHeaders({
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      });

      this.http.put<any>(`http://localhost:80/api/usuarios/${this.datosUsuario.id}`, datos, { headers })
        .subscribe({
          next: (respuesta) => {
            this.cargando = false;
            if (respuesta?.success) {
              this.mostrarMensaje('Perfil actualizado correctamente');
              this.authservice.refrescarToken().subscribe();
              this.cargarDatosUsuario();
              this.resetForm();
            } else {
              this.errorCarga = respuesta?.error || 'Error al actualizar el perfil';
            }
          },
          error: (error) => {
            this.cargando = false;
            console.error('Error:', error);
            this.errorCarga = 'Error al comunicarse con el servidor';
          }
        });
    }
}

  private resetForm() {
    this.contrasena = '';
    this.archivoSeleccionado = null;
    this.perfilForm?.resetForm({
      usuario: this.usuario,
      correo: this.correo,
      biografia: this.biografia
    });
  }

 subirImagen() {
    if (!this.archivoSeleccionado || !this.esMiPerfil) return;
    
    this.cargando = true;
    const token = this.authservice.obtenerToken();
    const formData = new FormData();
    formData.append('foto_perfil', this.archivoSeleccionado);

    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    this.http.post<any>(`http://localhost:80/api/usuarios/${this.datosUsuario.id}/foto`, formData, { headers })
      .subscribe({
        next: (respuesta) => {
          this.cargando = false;
          if (respuesta.success) {
            this.mostrarMensaje('Imagen de perfil actualizada correctamente');
            this.modalService.dismissAll();
            this.cargarDatosUsuario(); // Recargar datos para ver la nueva imagen
          } else {
            this.errorImagen = respuesta.error || 'Error al actualizar la imagen';
          }
        },
        error: (error) => {
          this.cargando = false;
          this.errorImagen = 'Error al comunicarse con el servidor';
          console.error('Error al subir imagen:', error);
        }
      });
}

  mostrarMensaje(mensaje: string) {
    this.snackBar.open(mensaje, 'Cerrar', {
      duration: 3000,
    });
  }

  toggleMenu() {
    this.menuAbierto = !this.menuAbierto;
  }

  cerrarAlerta() {
    this.errorCarga = null;
  }
}