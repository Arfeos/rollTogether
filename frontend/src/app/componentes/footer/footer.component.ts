import { HttpClient } from '@angular/common/http';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../servicios/auth.service';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-footer',
  imports: [FormsModule],
  templateUrl: './footer.component.html',
  styleUrl: './footer.component.css'
})
export class FooterComponent {
  nombre: string = "";
  correo: string = "";
  asunto: string = "";
  descripcion: string = "";
  constructor(private http: HttpClient, private authService: AuthService, private snackbar: MatSnackBar) { }
  reportarProblema() {
    const datos = {
      nombre: this.nombre,
      email: this.correo,
      asunto: this.asunto,
      descripcion: this.descripcion
    }
        this.http.post('http://localhost/api/reportes', datos).subscribe({
        next: () => {
            this.snackbar.open('Reporte enviado con éxito', 'Cerrar', {
                duration: 3000,
            });
            this.limpiarCampos();
        },
        error: (err) => {
            console.error('Error:', err);
            this.snackbar.open('Error al enviar el reporte', 'Cerrar', {
                duration: 3000,
            });
        }
    });
  }
  limpiarCampos() {
 this.nombre = "";
 this.correo = "";
  this.asunto = "";
  this.descripcion = "";
  }
}


