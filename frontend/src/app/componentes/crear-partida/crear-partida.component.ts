import { Component } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { AuthService } from '../../servicios/auth.service';
import { Router } from '@angular/router';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatNativeDateModule } from '@angular/material/core';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import {MatTooltipModule } from '@angular/material/tooltip';
import { MatSpinner } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-crear-partida',
  templateUrl: './crear-partida.component.html',
  styleUrls: ['./crear-partida.component.css'],
  imports: [ 
    CommonModule,
    FormsModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatButtonModule,
    MatTooltipModule,
    MatIconModule,
    NgbModule,
    MatSpinner
  ]
})

export class CrearPartidaComponent {
  partida: any = {
    titulo: '',
    descripcion: '',
    tipoPartida: 'presencial',
    sistema: '',
    categoria: '',
    aforoMaximo: 5,
    fechaHora: '',
    ubicacion: '',
   
  };
 hora='';
  fecha='';
  imageUrl: string | ArrayBuffer | null = null;
  ArchivoSeleccionado: File | null = null;
  isLoading = false;
  errorCarga: string | null = null;
  cargando: boolean = true;
  sistemas: any[] = [];
  categorias: any[] = [];

  constructor(
    private snackBar: MatSnackBar,
    private http: HttpClient,
    private authService: AuthService,
    private router: Router
  ) {

     if (!this.authService.estaAutenticado()) {
      this.errorCarga = "debes ser administrador para acceder a esta sección";
      console.error(this.errorCarga);
      this.cargando= false;
      return;
    }
  
    this.cargarSistemasYCategorias();
  }
  cargarSistemasYCategorias() {
    const token = this.authService.obtenerToken();
    this.http.get('http://localhost:80/api/sistemas', {
      headers: new HttpHeaders({
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`
      }) 
    }).subscribe({
      next: (data: any) => {
        this.sistemas = data;
      },
      error: (err) => {
        console.error('Error al cargar sistemas:', err);
      }
    });

    this.http.get('http://localhost:80/api/categorias', {
      headers: new HttpHeaders({
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`
      }) 
    }).subscribe({
      next: (data: any) => {
        this.categorias = data;
      },
      error: (err) => {
        console.error('Error al cargar categorías:', err);
      }
    });
  }

  onFileSelected(event: any): void {
const archivo: File = event.target.files[0];
    if (archivo) {
      const tiposPermitidos = ['image/jpeg', 'image/png', 'image/gif'];
      if (!tiposPermitidos.includes(archivo.type)) {
               this.snackBar.open('Solo se permiten imágenes JPEG, PNG o GIF', 'Cerrar', {
          duration: 3000,
          panelClass: ['error-snackbar']
        });
        return;
      }
      if (archivo.size > 5 * 1024 * 1024) {
          this.snackBar.open('La imagen no puede superar los 5MB', 'Cerrar', {
          duration: 3000,
          panelClass: ['error-snackbar']
        });
        return;
      }
       this.ArchivoSeleccionado = archivo;
             const reader = new FileReader();
      reader.readAsDataURL(archivo);
      reader.onload = () => {
        this.imageUrl = reader.result as string;
    }}
  }

  triggerFileInput(): void {
    document.getElementById('fileInput')?.click();
  }

  validarCampos(): boolean {
    const camposRequeridos = [
      'titulo', 'descripcion', 'tipoPartida', 
      'sistema', 'categoria', 'aforoMaximo',
      'fechaHora', 'ubicacion'
    ];

    for (const campo of camposRequeridos) {
      if (!this.partida[campo]) {
        this.snackBar.open(`El campo ${campo} es requerido`, 'Cerrar', {
          duration: 3000,
          panelClass: ['error-snackbar']
        });
        return false;
      }
    }

    if (this.partida.aforoMaximo < 1) {
      this.snackBar.open('El aforo mínimo es 1', 'Cerrar', {
        duration: 3000,
        panelClass: ['error-snackbar']
      });
      return false;
    }

    return true;
  }

  onSubmit(): void {
  const [hora, minutos] = this.hora.split(':').map(Number);
  const fechaHora = new Date(this.fecha);
  fechaHora.setHours(hora, minutos, 0, 0); 
  this.partida.fechaHora = fechaHora.toISOString().slice(0, 19).replace('T', ' ');
    console.log('Fecha:', this.partida.fechaHora);
  console.log('Fecha y hora:', fechaHora);
    if (!this.validarCampos()) {
      return;
    }

    this.isLoading = true;

    const formData = new FormData();
    formData.append('titulo', this.partida.titulo);
    formData.append('descripcion', this.partida.descripcion);
    formData.append('tipo', this.partida.tipoPartida);
    formData.append('id_sistema', this.partida.sistema);
    formData.append('id_categoria', this.partida.categoria);
    formData.append('aforo_max', this.partida.aforoMaximo);
    formData.append('fecha', new Date(this.partida.fechaHora).toISOString().slice(0, 19).replace('T', ' '));
    formData.append('ubicacion', this.partida.ubicacion);
    formData.append('id_creador', this.authService.getDatosUsuario().sub);
    
    if (this.ArchivoSeleccionado) {
      formData.append('portada', this.ArchivoSeleccionado);
      console.log('Archivo seleccionado:', this.ArchivoSeleccionado);
    }

    const token = this.authService.obtenerToken();
    console.log('Token:', token);
    this.http.post('http://localhost:80/api/partidas', formData, {headers: new HttpHeaders({
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`
      }) }).subscribe({
      next: (response: any) => {
        this.isLoading = false;
        this.snackBar.open('Partida creada exitosamente', 'Cerrar', {
          duration: 3000,
          panelClass: ['success-snackbar']
        });
        this.router.navigate(['/partidas', response.id]);
      },
      error: (err) => {
        this.isLoading = false;
        console.error('Error al crear partida:', err);
        this.snackBar.open('Error al crear la partida', 'Cerrar', {
          duration: 3000,
          panelClass: ['error-snackbar']
        });
      }
    });
  }
      cerrarAlerta() {
    this.errorCarga=null;
  }
}