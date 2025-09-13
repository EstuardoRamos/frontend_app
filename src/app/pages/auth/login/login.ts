// src/app/pages/auth/login.component.ts
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { RippleModule } from 'primeng/ripple';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { AuthService } from '@/services/auth.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    ButtonModule, CheckboxModule, InputTextModule, PasswordModule,
    RippleModule, ToastModule
  ],
  providers: [MessageService],
  templateUrl: 'login.html'
})
export class LoginComponent {
  email = '';
  password = '';
  checked = false; // “remember me” (si quieres, úsalo luego para elegir storage)
  loading = false;

  constructor(
    private auth: AuthService,
    private router: Router,
    private toast: MessageService
  ) {}

  login() {
    if (!this.email || !this.password) {
      this.toast.add({ severity: 'warn', summary: 'Campos requeridos', detail: 'Ingresa email y contraseña' });
      return;
    }

    this.loading = true;
    this.auth.loginAndLoadUser({ email: this.email, password: this.password }).subscribe({
      next: (user) => {
        console.log('Usuario autenticado:', user); // <-- aquí ves nombre/email/rol/etc
        this.toast.add({ severity: 'success', summary: 'Bienvenido', detail: 'Inicio de sesión correcto' });
        this.router.navigateByUrl('/');
      },
      error: (err) => {
        this.toast.add({
          severity: 'error',
          summary: 'Error',
          detail: err?.error?.message || 'Credenciales inválidas'
        });
      },
      complete: () => (this.loading = false)
    });
  }
}