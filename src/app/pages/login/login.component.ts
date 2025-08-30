import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ToastrService } from 'ngx-toastr';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
})
export class LoginComponent {
  private authService = inject(AuthService);
  private router = inject(Router);

  email = '';
  password = '';
  loading = false;
  error = '';

  constructor(private toast: ToastrService) { }

  onSubmit() {
    if (!this.email || !this.password) {
      this.error = 'Preencha todos os campos';
      return;
    }

    this.loading = true;
    this.error = '';

    firstValueFrom(this.authService.login(this.email, this.password))
      .then(() => {
        this.loading = false;
        this.toast.success(`Seja bem-vindo!`);
        this.router.navigate(['/dashboard']);
      })
      .catch((err) => {
        this.loading = false;
        this.toast.error(err.error?.message || 'Erro ao efetuar login');
        this.error = err.error?.message || 'Credenciais inválidas';
      });
  }
}
