import { CommonModule } from '@angular/common';
import { Component, ElementRef, ViewChild, OnInit } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { catchError } from 'rxjs/operators';
import { of } from 'rxjs';
import { ImageService } from '../../servicios/image.service';
import { AuthService } from '../../servicios/auth.service';

@Component({
  selector: 'app-index',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, MatProgressSpinnerModule],
  templateUrl: './index.component.html',
  styleUrls: ['./index.component.css']
})
export class IndexComponent implements OnInit {
  @ViewChild('filtrosModal') filtrosModal!: ElementRef;
  
  partidas: any[] = [];
  partidasFiltradas: any[] = [];
  partidasPaginadas: any[] = [];
  estaLogeado: boolean = false;
  paginaActual: number = 1;
  itemsPorPagina: number = 5;
  totalPartidas: number = 0;
  totalPaginas: number = 1;
  partidasOriginales: any[] = [];

  criterioOrdenacion: string = 'creacion';
  ordenAscendente: boolean = true;

  cargando: boolean = false;
  errorCarga: string | null = null;
  sistemas: string[] = [];
  categorias: string[] = [];

  filtros = {
    presencial: true,
    virtual: true,
    conAforo: false,
    sistema: '',
    categoria: ''
  };

  constructor(
    private modalService: NgbModal,
    private http: HttpClient,
    private imageServicio: ImageService,
    private authservice: AuthService
  ) {}

  ngOnInit(): void {
    this.estaLogeado = this.authservice.estaAutenticado();
    this.cargarPartidas();
    this.cargarSistemasYCategorias()
  }

  cargarPartidas(): void {
    this.cargando = true;
    this.errorCarga = null;

    this.http.get<any[]>('http://localhost:80/api/partidas')
      .pipe(
        catchError(error => {
          this.errorCarga = 'Error al cargar las partidas. Inténtalo de nuevo más tarde.';
          this.cargando = false;
          console.error('Error al cargar partidas:', error);
          return of([]);
        })
      )
      .subscribe(partidas => {
        this.partidas = partidas;
        this.partidasOriginales = [...partidas];
        this.aplicarFiltros();
        this.cargando = false;
      });
  }
cargarSistemasYCategorias() {
    const token = this.authservice.obtenerToken();
    this.http.get('http://localhost:80/api/sistemas', {
      headers: new HttpHeaders({
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`
      }) 
    }).subscribe({
      next: (data: any) => {
        this.sistemas = data.map((sistema: { nombre: string; })  => sistema.nombre);
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
        this.categorias = data.map((categoria: { nombre:String; }) => categoria.nombre);
      },
      error: (err) => {
        console.error('Error al cargar categorías:', err);
      }
    });
  }
  aplicarFiltros() {
        this.partidasFiltradas = this.partidasOriginales.filter(partida => {
      const cumpleTipo =
        (this.filtros.presencial && partida.tipo === 'presencial') ||
        (this.filtros.virtual && partida.tipo === 'digital');

      const cumpleAforo = !this.filtros.conAforo || (partida.plazas_ocupadas < partida.aforo_max);
      
      const cumpleSistema = !this.filtros.sistema || partida.sistema_nombre === this.filtros.sistema;
      
      const cumpleCategoria = !this.filtros.categoria || partida.categoria_nombre === this.filtros.categoria;

      return cumpleTipo && cumpleAforo && cumpleSistema && cumpleCategoria;
    });

    this.totalPartidas = this.partidasFiltradas.length;
    this.totalPaginas = Math.ceil(this.totalPartidas / this.itemsPorPagina);

    if (this.paginaActual > this.totalPaginas && this.totalPaginas > 0) {
      this.paginaActual = this.totalPaginas;
    } else if (this.totalPaginas === 0) {
      this.paginaActual = 1;
    }

    this.ordenarPartidas(this.criterioOrdenacion);
  }

  ordenarPartidas(criterio: string) {
    this.criterioOrdenacion = criterio;

    this.partidasFiltradas.sort((a, b) => {
      let resultado: number;

      switch (criterio) {
        case 'fecha':
          resultado = new Date(a.fecha).getTime() - new Date(b.fecha).getTime();
          break;
        case 'nombre':
          resultado = a.titulo.localeCompare(b.titulo);
          break;
        case 'creacion':
          resultado = new Date(a.fecha_creacion).getTime() - new Date(b.fecha_creacion).getTime();
          break;
        default:
          resultado = 0;
      }
this.paginaActual=1;
      return this.ordenAscendente ? resultado : -resultado;
    });

    this.actualizarPartidasPaginadas();
  }


  actualizarPartidasPaginadas() {
    const inicio = (this.paginaActual - 1) * this.itemsPorPagina;
    const fin = inicio + this.itemsPorPagina;
    this.partidasPaginadas = this.partidasFiltradas.slice(inicio, fin);
  }
  obtenerProtada(imagen:string){
    return this.imageServicio.getPortadaImagenUrl(imagen);
  }
    obtenerPerfil(imagen:string){
    return this.imageServicio.getUsuarioImagenUrl(imagen);
  }
  cambiarPagina(nuevaPagina: number) {
    if (nuevaPagina >= 1 && nuevaPagina <= this.totalPaginas) {
      this.paginaActual = nuevaPagina;
      this.actualizarPartidasPaginadas();
    }
  }

  abrirModalFiltros(): void {
    this.modalService.open(this.filtrosModal, { size: 'lg' });
  }
  cerrarAlerta() {
    this.errorCarga=null;
  }
}
