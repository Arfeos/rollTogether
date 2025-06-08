import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../servicios/auth.service';

@Component({
  selector: 'app-administracion',
  standalone: true,
  templateUrl: './administracion.component.html',
  styleUrls: ['./administracion.component.css'],
  imports: [
    CommonModule,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    RouterModule
  ]
})
export class AdministracionComponent {
  constructor(private authService: AuthService) { }
  errorCarga: string | null = null;
ngOnInit(): void {
     if (!this.authService.estaAutenticado() || this.authService.getDatosUsuario().rol !== 'admin') {
      this.errorCarga = "debes ser administrador para acceder a esta sección";
      return;
    }
  }
  // Opciones del menú de administración
  opcionesAdmin = [
    { 
      titulo: 'Listar Partidas', 
      icono: 'sports_esports',
      ruta: '/admin/partidas'
    },
    { 
      titulo: 'Listar Usuarios', 
      icono: 'people',
      ruta: '/admin/usuarios'
    },
    { 
      titulo: 'Listar Reportes', 
      icono: 'report',
      ruta: '/admin/reportes'
    },
    { 
      titulo: 'Crear Sistema/Categoría', 
      icono: 'add_circle_outline',
      ruta: '/admin/crear'
    },
        { 
      titulo: 'listar Categorias', 
      icono: 'category',
      ruta: '/admin/categorias'
    },
        { 
      titulo: 'listar Sistemas', 
      icono: 'computer',
      ruta: '/admin/sistemas'
    }
  ];
    cerrarAlerta() {
    this.errorCarga=null;
  }
}