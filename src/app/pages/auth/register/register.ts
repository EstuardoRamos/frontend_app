// src/app/pages/auth/register.component.ts
import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, AbstractControl, ValidationErrors, FormsModule } from '@angular/forms';

import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { ToastModule } from 'primeng/toast';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { MessageService } from 'primeng/api';

import { AuthService } from '@/services/auth.service';
//import { UsersService } from '@/services/users.service';
import { Router } from '@angular/router';
import { RegisterDTO, Rol, UserDTO } from '@/interfaces/user.model';
import { UsersService } from '@/services/user.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule,
    InputTextModule, ButtonModule, SelectModule, ToastModule,
    TableModule, TagModule, FormsModule
  ],
  providers: [MessageService],
  template: `
  <div class="w-full max-w-6xl mx-auto p-6">
    <h2 class="text-2xl font-bold mb-4">Crear cuenta</h2>

    <form [formGroup]="form" (ngSubmit)="onSubmit()" class="grid grid-cols-12 gap-4 card p-4 mb-6">
      <div class="col-span-12 md:col-span-6">
        <label class="font-semibold block mb-1">Nombre completo</label>
        <input pInputText formControlName="nombre" placeholder="Ej. Juan Pérez" class="w-full"
               [ngClass]="{'p-invalid': invalid('nombre')}" />
        <small class="text-red-500" *ngIf="invalid('nombre')">Mínimo 3 caracteres.</small>
      </div>

      <div class="col-span-12 md:col-span-6">
        <label class="font-semibold block mb-1">Email</label>
        <input pInputText formControlName="email" type="email" placeholder="correo@ejemplo.com" class="w-full"
               [ngClass]="{'p-invalid': invalid('email')}" />
        <small class="text-red-500" *ngIf="invalid('email')">Correo inválido.</small>
      </div>

      <div class="col-span-12 md:col-span-6">
        <label class="font-semibold block mb-1">Contraseña</label>
        <input pInputText formControlName="password" type="password" placeholder="••••••••" class="w-full"
               [ngClass]="{'p-invalid': invalid('password')}" />
        <small class="text-gray-500 block">Mín 8, con mayúscula, minúscula, número y símbolo.</small>
        <small class="text-red-500" *ngIf="invalid('password')">Contraseña no cumple requisitos.</small>
      </div>

      <div class="col-span-12 md:col-span-3">
        <label class="font-semibold block mb-1">DPI</label>
        <input pInputText formControlName="dpi" placeholder="13 dígitos" class="w-full"
               [ngClass]="{'p-invalid': invalid('dpi')}" />
        <small class="text-red-500" *ngIf="invalid('dpi')">Debe contener 13 dígitos.</small>
      </div>

      <div class="col-span-12 md:col-span-3">
        <label class="font-semibold block mb-1">Rol</label>
        <p-select class="w-full" formControlName="rol"
                  [options]="rolesOptions" optionLabel="label" optionValue="value"
                  [ngClass]="{'p-invalid': invalid('rol')}"></p-select>
        <small class="text-red-500" *ngIf="invalid('rol')">Selecciona un rol.</small>
      </div>

      <div class="col-span-12">
        <p-button type="submit" label="Registrarme" icon="pi pi-check" [disabled]="form.invalid || loading"></p-button>
      </div>
    </form>

    <!-- Listado de usuarios -->
    <div class="flex items-center justify-between mb-3">
      <h3 class="text-xl font-semibold">Usuarios</h3>
      <div class="flex gap-2 items-end">
        <p-select class="w-16rem" [(ngModel)]="filtros.rol"
                  [options]="rolesFilter" optionLabel="label" optionValue="value"
                  placeholder="Rol (todos)"></p-select>
        <p-select class="w-12rem" [(ngModel)]="filtros.enabled"
                  [options]="enabledOptions" optionLabel="label" optionValue="value"
                  placeholder="Estado (todos)"></p-select>
        <input pInputText class="w-16rem" [(ngModel)]="filtros.q" placeholder="Buscar nombre/email/dpi" />
        <p-button label="Buscar" icon="pi pi-search" (onClick)="loadUsers()" />
        <p-button label="Limpiar" icon="pi pi-eraser" severity="secondary" (onClick)="clearFilters()" />
      </div>
    </div>

    <div class="card">
      <p-table [value]="users()" [paginator]="true" [rows]="20" [rowsPerPageOptions]="[10,20,50]" dataKey="id">
        <ng-template #header>
          <tr>
            <th>Nombre</th>
            <th>Email</th>
            <th>DPI</th>
            <th>Rol</th>
            <th>Estado</th>
            <th>Creado</th>
          </tr>
        </ng-template>
        <ng-template #body let-u>
          <tr>
            <td class="font-medium">{{ u.nombre }}</td>
            <td>{{ u.email }}</td>
            <td>{{ u.dpi }}</td>
            <td><p-tag [value]="u.rol"></p-tag></td>
            <td><p-tag [value]="u.enabled ? 'ACTIVO' : 'INACTIVO'" [severity]="u.enabled ? 'success' : 'danger'"></p-tag></td>
            <td>{{ u.createdAt | date:'short' }}</td>
          </tr>
        </ng-template>
      </p-table>
    </div>

    <p-toast />
  </div>
  `
})
export class RegisterComponent implements OnInit {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private usersSvc = inject(UsersService);
  private toast = inject(MessageService);
  private router = inject(Router);

  loading = false;

  rolesOptions = [
    { label: 'ADMIN', value: 'ADMIN' as Rol },
    { label: 'CLIENTE', value: 'CLIENTE' as Rol },
    { label: 'EMPLEADO_REST', value: 'EMPLEADO_REST' as Rol },
    { label: 'EMPLEADO_HOTEL', value: 'EMPLEADO_HOTEL' as Rol }
  ];
  rolesFilter = [{ label: 'Todos', value: '' }, ...this.rolesOptions];
  enabledOptions = [
    { label: 'Todos', value: '' },
    { label: 'Activos', value: 'true' },
    { label: 'Inactivos', value: 'false' }
  ];

  form = this.fb.group({
    nombre: ['', [Validators.required, Validators.minLength(3)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, this.passwordStrong]],
    dpi: ['', [Validators.required, Validators.pattern(/^\d{13}$/)]],
    rol: ['', [Validators.required]]
  });

  // Listado
  filtros = { q: '', rol: '' as '' | Rol, enabled: '' as '' | 'true' | 'false', page: 0, size: 20 };
  private _users = signal<UserDTO[]>([]);
  users = this._users.asReadonly();

  ngOnInit(): void {
    this.loadUsers();
  }

  // ---------- Registro ----------
  invalid(ctrl: string) {
    const c = this.form.get(ctrl)!;
    return c.touched && c.invalid;
  }

  passwordStrong(control: AbstractControl): ValidationErrors | null {
    const v = (control.value || '') as string;
    if (!v) return { weak: true };
    const ok = /[A-Z]/.test(v) && /[a-z]/.test(v) && /\d/.test(v) && /[^A-Za-z0-9]/.test(v) && v.length >= 8;
    return ok ? null : { weak: true };
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
        this.form.reset();
        this.loading = false;
        // Opcional: refrescar listado para ver al nuevo usuario
        this.loadUsers();
      },
      error: (err) => {
        this.loading = false;
        const detail = err?.error?.message || err.message || 'No se pudo registrar';
        this.toast.add({ severity: 'error', summary: 'Error', detail });
      }
    });
  }

  // ---------- Listar usuarios ----------
  loadUsers() {
    const params: any = {
      page: this.filtros.page,
      size: this.filtros.size
    };
    if (this.filtros.q) params.q = this.filtros.q;
    if (this.filtros.rol) params.rol = this.filtros.rol;
    if (this.filtros.enabled) params.enabled = this.filtros.enabled;

    this.usersSvc.listar(params).subscribe({
      next: (arr) => this._users.set(arr ?? []),
      error: (err) => this.toast.add({ severity: 'error', summary: 'Error', detail: err?.error?.message || 'No se pudieron cargar usuarios' })
    });
  }

  clearFilters() {
    this.filtros = { q: '', rol: '', enabled: '', page: 0, size: 20 };
    this.loadUsers();
  }
}