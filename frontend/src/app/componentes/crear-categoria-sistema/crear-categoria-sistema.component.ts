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
  errorCarga: string|null= null;
  cargando: boolean=true;
  
  constructor(private authService:AuthService) { }
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
    console.log('Categoría registrada:', {
      nombre: this.nombreCategoria
    });
    this.resetFormularios();
  }

  registrarSistema() {
    console.log('Sistema registrado:', {
      nombre: this.nombreSistema,
      descripcion: this.descripcionSistema,
      anioSalida: this.anioSalidaSistema
    });
    this.resetFormularios();
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
