import { CommonModule } from '@angular/common';
import { Component, TemplateRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { AuthService } from '../../servicios/auth.service';
import { Subscription } from 'rxjs';
import { ImageService } from '../../servicios/image.service';
import { MatIcon } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, MatIcon],
  templateUrl: './header.component.html',
  styleUrl: './header.component.css'
})
export class HeaderComponent {
  usuarioLogueado = false;
  id: string | null = null;

  private authSubscription!: Subscription;
  private userSubscription!: Subscription;
  usuario: string = '';
  foto: string = 'assets/usuarios/default-user.png';
fotoUrl!:string;
  loginError: string | null = null;
  registerError: string | null = null;
  alerts: string[] = [];

  recordarme: boolean = false;
  emailInput: string = '';
  emailrecuperacion: string = '';
  contrasenaInput: string = '';
  selectedFile: File | null = null;
  registerData = {
    nombre: '',
    email: '',
    password: '',
    foto_perfil: 'assets/usuarios/default-user.png',
    bio: ''
  };

  constructor(private modalService: NgbModal, private http:HttpClient, private authService: AuthService, private imageService:ImageService,private snackbar:MatSnackBar) { }

  ngOnInit(): void {
    this.authSubscription = this.authService.authStatus$.subscribe(isLoggedIn => {
      this.usuarioLogueado = isLoggedIn;
      this.actualizarDatosUsuario();
    });

    this.userSubscription = this.authService.userData$.subscribe(userData => {
      this.actualizarDatosUsuario();
    });
  }

  ngOnDestroy(): void {
    this.authSubscription.unsubscribe();
    this.userSubscription.unsubscribe();
  }
  private actualizarDatosUsuario(): void {
    const userData = this.authService.getDatosUsuario();

    if (userData) {
      this.usuario = userData.nombre || userData.email;
      this.foto =  userData.foto_perfil || 'assets/usuarios/default-user.png';
      this.fotoUrl= this.imageService.getUsuarioImagenUrl(this.foto);
      this.id = userData.sub;
    } else {
      this.usuario = '';
      this.foto = 'assets/usuarios/default-user.png';
      this.id = null;
    }
  }


  abrirModal(modal: TemplateRef<any>) {
    this.modalService.open(modal, { centered: true });
  }

  cerrarModal() {
    this.modalService.dismissAll();
  }


  login() {
    if (!this.emailInput || !this.contrasenaInput) {
      this.loginError = 'Email y contraseña son requeridos.';
      return;
    }

    this.loginError = null;

    this.authService.login(this.emailInput, this.contrasenaInput).subscribe({
      next: (response: any) => {
        if (response.token) {
          this.authService.guardarToken(response.token);
          this.cerrarModal();
          window.location.reload();
        }
      },
      error: (err) => {
        console.error('Error en login:', err);
        this.loginError = err.error?.error || 'Credenciales incorrectas';
      }
    });
  }


  registrar() {
    this.registerError = null;

    if (!this.registerData.nombre?.trim() || !this.registerData.email?.trim() || !this.registerData.password) {
      this.registerError = 'Nombre, email y contraseña son requeridos';
      return;
    }

    const formData = new FormData();
    formData.append('nombre', this.registerData.nombre);
    formData.append('email', this.registerData.email);
    formData.append('password', this.registerData.password);
    formData.append('bio', this.registerData.bio);

    if (this.selectedFile) {
      formData.append('foto', this.selectedFile);
    }

    this.authService.register(formData).subscribe({
      next: (response) => {
        this.alerts.push('Registro completado con éxito');
        this.cerrarModal();
      },
      error: (err) => {
        console.error('Error en registro:', err);
        this.registerError = err.error?.error || 'Error en el registro';
      }
    });
    this.limpiarFormulario();
  }
  limpiarFormulario() {
    this.registerData.nombre = '';
    this.registerData.email = '';
    this.registerData.password = '';
    this.registerData.bio = '';
    this.selectedFile = null;
  }

  handleFileInput(event: any) {
    this.selectedFile = event.target.files[0];
  }

  recuperar() {
  const email = this.emailrecuperacion; 

  if (!email) {
    this.snackbar.open('Por favor ingresa un correo electrónico.', 'Cerrar', {
      duration: 3000
    });
    return;
  }

  this.http.post('http://localhost/api/recuperar', { correo: email }, {
    headers: { 'Content-Type': 'application/json' }
  }).subscribe({
    next: (response: any) => {
      this.snackbar.open(response.mensaje || 'Correo de recuperación enviado', 'Cerrar', {
        duration: 5000
      });
      this.cerrarModal();
      this.emailrecuperacion = '';
    },
    error: (err) => {
      console.error('Error al enviar correo de recuperación:', err);
      const errorMsg = err.error?.error || 'Error al enviar correo de recuperación';
      this.snackbar.open(errorMsg, 'Cerrar', {
        duration: 5000
      });
    }
  });
}

  logout() {
    localStorage.removeItem('auth_token');
    this.usuarioLogueado = false;
    this.usuario = '';
    this.foto = 'assets/usuarios/default-user.png';

    // Opcional: Redirigir al home
    window.location.href = '/';
  }

  cerrarAlerta(i: number) {
    this.alerts.splice(i, 1);
  }
}