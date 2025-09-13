// src/app/pages/auth/register.component.ts
import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, AbstractControl, ValidationErrors } from '@angular/forms';

import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';

import { AuthService } from '@/services/auth.service';
import { Router } from '@angular/router';
import { RegisterDTO, Rol } from '@/interfaces/user.model';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, InputTextModule, ButtonModule, SelectModule, ToastModule],
  providers: [MessageService],
  template: `
  <div class="w-full max-w-xl mx-auto p-6">
    <h2 class="text-2xl font-bold mb-4">Crear cuenta</h2>

    <form [formGroup]="form" (ngSubmit)="onSubmit()" class="space-y-4">

      <div>
        <label class="font-semibold block mb-1">Nombre completo</label>
        <input pInputText formControlName="nombre" placeholder="Ej. Juan Pérez" class="w-full"
               [ngClass]="{'p-invalid': invalid('nombre')}" />
        <small class="text-red-500" *ngIf="invalid('nombre')">Mínimo 3 caracteres.</small>
      </div>

      <div>
        <label class="font-semibold block mb-1">Email</label>
        <input pInputText formControlName="email" type="email" placeholder="correo@ejemplo.com" class="w-full"
               [ngClass]="{'p-invalid': invalid('email')}" />
        <small class="text-red-500" *ngIf="invalid('email')">Correo inválido.</small>
      </div>

      <div>
        <label class="font-semibold block mb-1">Contraseña</label>
        <input pInputText formControlName="password" type="password" placeholder="••••••••" class="w-full"
               [ngClass]="{'p-invalid': invalid('password')}" />
        <small class="text-gray-500 block">Mín 8, al menos: 1 mayúscula, 1 minúscula, 1 número y 1 símbolo.</small>
        <small class="text-red-500" *ngIf="invalid('password')">Contraseña no cumple requisitos.</small>
      </div>

      <div>
        <label class="font-semibold block mb-1">DPI</label>
        <input pInputText formControlName="dpi" placeholder="13 dígitos" class="w-full"
               [ngClass]="{'p-invalid': invalid('dpi')}" />
        <small class="text-red-500" *ngIf="invalid('dpi')">Debe contener 13 dígitos.</small>
      </div>

      <div>
        <label class="font-semibold block mb-1">Rol</label>
        <p-select class="w-full" formControlName="rol"
                  [options]="rolesOptions" optionLabel="label" optionValue="value"
                  [ngClass]="{'p-invalid': invalid('rol')}"></p-select>
        <small class="text-red-500" *ngIf="invalid('rol')">Selecciona un rol.</small>
      </div>

      <div class="pt-2">
        <p-button type="submit" label="Registrarme" icon="pi pi-check" [disabled]="form.invalid || loading"></p-button>
      </div>
    </form>

    <p-toast />
  </div>
  `
})
export class RegisterComponent implements OnInit {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private toast = inject(MessageService);
  private router = inject(Router);

  loading = false;

  rolesOptions = [
    { label: 'ADMIN', value: 'ADMIN' as Rol },
    { label: 'CLIENTE', value: 'CLIENTE' as Rol },
    { label: 'EMPLEADO_REST', value: 'EMPLEADO_REST' as Rol },
    { label: 'EMPLEADO_HOTEL', value: 'EMPLEADO_HOTEL' as Rol }
  ];

  form = this.fb.group({
    nombre: ['', [Validators.required, Validators.minLength(3)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, this.passwordStrong]],
    dpi: ['', [Validators.required, Validators.pattern(/^\d{13}$/)]],
    rol: ['', [Validators.required]]
  });

  ngOnInit(): void {}

  invalid(ctrl: string) {
    const c = this.form.get(ctrl)!;
    return c.touched && c.invalid;
  }

  passwordStrong(control: AbstractControl): ValidationErrors | null {
    const v = (control.value || '') as string;
    if (!v) return { weak: true };
    const ok = /[A-Z]/.test(v) && /[a-z]/.test(v) && /\d/.test(v) && /[^A-Za-z0-9]/.test(v) && v.length >= 8;
    return ok ? null : { weak: true };
    // si prefieres menos estricto: solo length >= 8
  }

  onSubmit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.loading = true;
    const payload = this.form.value as RegisterDTO;

    this.auth.register(payload).subscribe({
      next: (u) => {
        this.toast.add({ severity: 'success', summary: 'Registro exitoso', detail: u.email });
        this.loading = false;
        this.router.navigate(['/login']); // redirige al login
      },
      error: (err) => {
        this.loading = false;
        const detail = err?.error?.message || err.message || 'No se pudo registrar';
        this.toast.add({ severity: 'error', summary: 'Error', detail });
      }
    });
  }
}