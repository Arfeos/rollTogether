import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';
import { catchError, of, switchMap } from 'rxjs';
import { AuthService } from '../../servicios/auth.service';
import { ImageService } from '../../servicios/image.service';
import { MatTooltip } from '@angular/material/tooltip';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatProgressSpinner } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-modificar-partida',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatButtonModule,
    MatIconModule,
    NgbModule,
    MatTooltip,
    MatProgressSpinner
  ],
  templateUrl: './modificar-partida.component.html',
  styleUrls: ['./modificar-partida.component.css']
})
export class ModificarPartidaComponent implements OnInit {


  fecha: Date | null = null;
  hora: string = '';
  imageUrl: string | null = null;
  id!: string | null;

  sistemas: any[] = [];
  categorias: any[] = [];
  partida = {
    titulo: '',
    tipoPartida: '',        
    sistema: null,         
    categoria: null,        
    descripcion: '',
    aforoMaximo: 1,
    ubicacion: ''
  };
  errorCarga: string | null = null;
  cargando: boolean = true;
 archivoSeleccionado: File | null = null; 
  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private http: HttpClient,
    private authservice: AuthService,
    private imgService: ImageService,
    private snackbar:MatSnackBar
  ) { }

  ngOnInit(): void {
        if (!this.authservice.estaAutenticado()) {
      this.errorCarga = "debes iniciar sesión para ver tus partidas";
      this.cargando= false;
      return;
    }
  
    this.id = this.route.snapshot.paramMap.get('partida_id');
    this.cargarDatosPartida();
  }

  cargarDatosPartida(): void {
    if (this.id) {
      this.http.get<any>(`http://localhost:80/api/partidas/${this.id}`)
        .pipe(
          catchError(err => {
      this.errorCarga = "ha ocurrido un error al  cargar los datos";
            return of(null);
          })
        )
        .subscribe(data => {
          if (data) {
              const datosToken = this.authservice.getDatosUsuario();
              if(datosToken.rol !== 'admin' && datosToken.sub !== data.id_creador) {
                this.errorCarga = "no tienes permiso para modificar esta partida";
                this.cargando = false;
                return;
              }
            const [fechaStr, horaStr] = data.fecha.split(' ');
            this.fecha = new Date(fechaStr);
            this.hora = horaStr;
            this.partida = {
              titulo: data.titulo,
              tipoPartida: data.tipo,
              sistema: data.id_sistema,
              categoria: data.id_categoria,
              descripcion: data.descripcion,
              aforoMaximo: data.aforo_max,
              ubicacion: data.ubicacion
            };
            this.imageUrl = this.imgService.getPortadaImagenUrl(data.portada) || null;
          }
          this.cargarSistemasyCategorias();
        });
    }

  }

  cargarSistemasyCategorias(): void {
    const token = this.authservice.obtenerToken();

    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Authorization': `Bearer ${token}`
    });

    this.http.get<string[]>('http://localhost:80/api/sistemas', { headers }).subscribe({
      next: (data) => {
        this.sistemas = data;
      },
      error: (err) => console.error('Error al cargar sistemas:', err)
    });

    this.http.get<string[]>('http://localhost:80/api/categorias', { headers }).subscribe({
      next: (data) => {
        this.categorias = data;
      },
      error: (err) => console.error('Error al cargar categorías:', err)
    });
  }

  onFileSelected(event: any): void {
    const archivo = event.target.files[0];
    if (archivo) {
      const tiposPermitidos = ['image/jpeg', 'image/png', 'image/gif'];
      if (!tiposPermitidos.includes(archivo.type)) {
    
              this.snackbar.open('Solo se permiten imágenes JPEG, PNG o GIF', 'Cerrar', {
      duration: 3000,
        });
        return;
      }
      if (archivo.size > 5 * 1024 * 1024) {
      this.snackbar.open('La imagen no puede superar los 5MB', 'Cerrar', {
      duration: 3000,
        });
        return;
      }
       this.archivoSeleccionado = archivo;
      const reader = new FileReader();
      reader.readAsDataURL(archivo);
      reader.onload = () => {
        this.imageUrl = reader.result as string;
      };
    
  }
  }
  triggerFileInput(): void {
    document.getElementById('fileInput')?.click();
  }

  onSubmit(): void {
    if (!this.id) return;

    const fechaHora = this.fecha && this.hora ? `${this.formatearFecha(this.fecha)} ${this.hora}` : null;

    const token = this.authservice.obtenerToken();
    const headersJSON = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });

    const datosPartida = {
      ...this.partida,
      fecha: fechaHora
    };
    this.http.put<any>(`http://localhost:80/api/partidas/${this.id}`, datosPartida, { headers: headersJSON })
      .pipe(
        switchMap(respuesta => {
          if (!respuesta?.success && respuesta?.error) {
            throw new Error(respuesta.error);
          }
          if (this.archivoSeleccionado) {
            const formData = new FormData();
            formData.append('portada', this.archivoSeleccionado);

            const headersFormData = new HttpHeaders({ 'Authorization': `Bearer ${token}` });
            return this.http.post<any>(`http://localhost:80/api/partidas/${this.id}/portada`, formData, { headers: headersFormData });
          } else {
            return of({ success: true });
          }
        }),
        catchError(err => {
          console.error('Error al actualizar partida:', err);
          this.snackbar.open('Error al actualizar la partida', 'Cerrar', {
      duration: 3000,
        });
          return of(null);
        })
      )
      .subscribe(respuestaFinal => {
        if (respuestaFinal?.success) {
                    this.snackbar.open('Partida actualizada correctamente', 'Cerrar', {
      duration: 3000,
        });
          this.router.navigate(['/Mis-partidas']);
        }
      });
  }

  formatearFecha(fecha: Date): string {
    const yyyy = fecha.getFullYear();
    const mm = String(fecha.getMonth() + 1).padStart(2, '0');
    const dd = String(fecha.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }
  cerrarAlerta() {
    this.errorCarga=null;
  }
}
