import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { AuthService } from '../../servicios/auth.service';

@Component({
  selector: 'app-detalle-reporte',
  imports: [    CommonModule,
    RouterModule,
    MatProgressSpinnerModule,
    MatIconModule,
  CommonModule],
  templateUrl: './detalle-reporte.component.html',
  styleUrl: './detalle-reporte.component.css'
})
export class DetalleReporteComponent {

  cargando: boolean = false;
  error: string | null = null;
  reporte!: any;
constructor(private http:HttpClient, private authservice:AuthService,   private route: ActivatedRoute, private router:Router ){}
  ngOnInit(){
    this.cargando = true;
    this.error = null;
    const id = this.route.snapshot.paramMap.get('reporte_id');
    if (id) {
      this.http.get<any>(`http://localhost:80/api/reportes/${id}`, {
        headers: {
          'Authorization': `Bearer ${this.authservice.obtenerToken()}`
        }
      }).subscribe({
        next: (data) => {
          this.cargando = false;
          this.reporte = data;
          console.log('Reporte cargado:', this.reporte);
          console.log(data);
        },
        error: (err) => {
          this.cargando = false;
          this.error = 'Error al cargar el reporte. Inténtalo de nuevo más tarde.';
          console.error('Error al cargar el reporte:', err);
        }
      });
    } else {
      this.cargando = false;
      this.error = 'ID de reporte no proporcionado.';
    }
  }
cambiarestado(id_reporte: string) {
 let nuevoEstado="";
  if(this.reporte.estado="resuelto"){
     nuevoEstado = 'pendiente';
  }
  else{
    nuevoEstado = 'resuelto';
  }
  const body = {
    estado: nuevoEstado
  };

  this.http.put(`http://localhost:80/api/reportes/${id_reporte}/estado`, body, {
    headers: {
      'Authorization': `Bearer ${this.authservice.obtenerToken()}`,
      'Content-Type': 'application/json'
    }
  }).subscribe({
    next: (data) => {
      console.log('Estado actualizado correctamente:', data);
      // Actualiza el estado localmente
      if (this.reporte && this.reporte.id == +id_reporte) {
        this.reporte.estado = nuevoEstado;
      }
    },
    error: (error) => {
      console.error('Error al cambiar el estado:', error);
      this.error = 'No se pudo actualizar el estado. Intenta de nuevo.';
    }
  });
}

    cerrarAlerta() {
    this.error=null;
  }
}
