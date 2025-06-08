import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../../servicios/auth.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-crear-categoria-sistema',
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatCardModule,
    MatInputModule,
    MatSelectModule,
    MatFormFieldModule,
    MatIconModule,
  ],
  templateUrl: './crear-categoria-sistema.component.html',
  styleUrl: './crear-categoria-sistema.component.css'
})
export class CrearCategoriaSistemaComponent {
  tipoSeleccionado: string = '';
  mostrarFormulario: boolean = false;
  nombreCategoria: string = '';
  nombreSistema: string = '';
  descripcionSistema: string = '';
  anioSalidaSistema: number | null = null;
  errorCarga: string | null = null;
  cargando: boolean = true;

  constructor(private authService: AuthService, private http: HttpClient, private snackbar: MatSnackBar) { }
  ngOnInit(): void {
    if (!this.authService.estaAutenticado() || this.authService.getDatosUsuario().rol !== 'admin') {
      this.errorCarga = "Debes ser administrador para acceder a esta sección";
    }
    this.cargando = false;
  }

  seleccionarTipo(tipo: string) {
    this.tipoSeleccionado = tipo;
    this.mostrarFormulario = true;
  }

  registrarCategoria() {
    const data = { nombre: this.nombreCategoria };
    this.http.post('http://localhost:80/api/categorias', data, {
      headers: {
        'Authorization': `Bearer ${this.authService.obtenerToken()}`
      }
    }).subscribe({
      next: (response) => {
        this.snackbar.open('¡Categoría registrada con éxito!', 'Cerrar', { duration: 3000 });
        this.resetFormularios();
      },
      error: (error) => {
this.snackbar.open(`Error al registrar categoría: ${error.error?.error || 'Error desconocido'}`, 'Cerrar', { duration: 3000 });
      }
    });
  }

  registrarSistema() {
    const data = {
      nombre: this.nombreSistema,
      descripcion: this.descripcionSistema,
      anio_salida: this.anioSalidaSistema
    };
    this.http.post('http://localhost:80/api/sistemas', data, {
      headers: {
        'Authorization': `Bearer ${this.authService.obtenerToken()}`
      }
    }).subscribe({
      next: (response) => {
        this.snackbar.open('¡Sistema de juego registrado con éxito!', 'Cerrar', { duration: 3000 });
        this.resetFormularios();
      },
      error: (error) => {
this.snackbar.open(`Error al registrar categoría: ${error.error?.error || 'Error desconocido'}`, 'Cerrar', { duration: 3000 });
      }
    });
  }

  resetFormularios() {
    this.nombreCategoria = '';
    this.nombreSistema = '';
    this.descripcionSistema = '';
    this.anioSalidaSistema = null;
    this.mostrarFormulario = false;
    this.tipoSeleccionado = '';
  }
}
