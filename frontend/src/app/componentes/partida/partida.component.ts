import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { HttpClient, HttpClientModule, HttpHeaders } from '@angular/common/http';
import { of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AuthService } from '../../servicios/auth.service';
import { ImageService } from '../../servicios/image.service';
import { MatProgressSpinner } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-partida',
  standalone: true,
  imports: [CommonModule, RouterModule, HttpClientModule, MatProgressSpinner],
  templateUrl: './partida.component.html',
  styleUrls: ['./partida.component.css']
})
export class PartidaComponent implements OnInit {
  partida: any = {};
  existe: boolean = false;
  cargando: boolean = true;
  error: string | null = null;
  inscripciones: any[] = [];
  aforolleno: boolean = false;
  id!: string | null;
  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private http: HttpClient,
    private authservice: AuthService,
    private imgService: ImageService
  ) { }

  ngOnInit(): void {
    this.id = this.route.snapshot.paramMap.get('id_partida');
    this.cargardatos();
  }

  inscribirse(): void {
    
    
    if (this.id) {
      this.http.post(`http://localhost:80/api/inscripciones`, {
        id_usuario: this.authservice.getDatosUsuario().sub,
        id_partida: this.id
      },{
      headers: {
        'Authorization': `Bearer ${this.authservice.obtenerToken()}`
      }
    }).subscribe({
        next: () => {
            this.cargardatos();
        },
        error: (err) => {
          console.error('Error al inscribirse:', err);
        }
      });
    }
  }

  abandonar(): void {
    if (this.id) {
      this.http.delete(`http://localhost:80/api/inscripciones/partida/${this.id}`,{headers: {
        'Authorization': `Bearer ${this.authservice.obtenerToken()}`
      }}).subscribe({
        next: () => {
          this.cargardatos();
        },
        error: (err) => {
          console.error('Error al abandonar:', err);
        }
      });
    }
  }
cargardatos() {
  if (this.id) {
    this.http.get<any>(`http://localhost:80/api/partidas/${this.id}`)
      .pipe(
        catchError(err => {
          this.router.navigate(['/not-found']);
          return of(null);
        })
      )
      .subscribe(data => {
        if (data) {
          this.partida = {
            ...data,
            titulo: data.titulo,
            descripcion: data.descripcion,
            sistema: data.sistema_nombre,
            categoria: data.categoria_nombre,
            fecha_hora: data.fecha,
            fecha_creacion: data.fecha_creacion,
            ubicacion: data.ubicacion,
            estado: data.estado,
            imagen: this.imgService.getPortadaImagenUrl(data.portada),
            img: this.imgService.getUsuarioImagenUrl(data.foto_perfil),
            nombre_usuario: data.creador_nombre,
            creado_por: data.id_creador
          };
          this.aforolleno = this.partida.plazas_ocupadas >= this.partida.aforo_max;

          // Verificar participación si el usuario está logueado
          if (this.isLoggedIn && !this.isOwner) {
            this.http.get<any>(`http://localhost:80/api/inscripciones/partidaInscrito/${this.id}`,{headers: {
        'Authorization': `Bearer ${this.authservice.obtenerToken()}`
      }})
              .subscribe({
                next: (res) => {
                  this.existe = res.inscrito;
                  this.cargando = false;
                },
                error: (err) => {
                  this.error = 'Error al verificar inscripción';
                  this.cargando = false;
                }
              });
          } else {
            this.cargando = false;
          }
        }
      });
  }
}

  get isOwner(): boolean {
    // Reemplaza esto con tu lógica real usando AuthService
    const userId = this.authservice.getDatosUsuario().sub;
    return userId === this.partida.creado_por;
  }

  get isLoggedIn(): boolean {
    return this.authservice.estaAutenticado();
  }
  cerrarAlerta() {
    this.error=null;
  }
}
