// src/app/layout/app.menu.ts
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { MenuItem } from 'primeng/api';
import { AppMenuitem } from './app.menuitem';
import { AuthService } from '@/services/auth.service';

@Component({
  selector: 'app-menu',
  standalone: true,
  imports: [CommonModule, AppMenuitem, RouterModule],
  template: `<ul class="layout-menu">
    <ng-container *ngFor="let item of model; let i = index">
      <li app-menuitem *ngIf="!item.separator" [item]="item" [index]="i" [root]="true"></li>
      <li *ngIf="item.separator" class="menu-separator"></li>
    </ng-container>
  </ul>`
})
export class AppMenu {
  model: MenuItem[] = [];
  constructor(private auth: AuthService, private router: Router) {}

  ngOnInit() {
    const isAdmin   = this.auth.hasRole('ADMIN');
    const isCliente = this.auth.hasRole('CLIENTE');
    const isLogged  = !!this.auth.token;

    const full: MenuItem[] = [
      {
        label: 'Inicio',
        items: [{ label: 'Dashboard', icon: 'pi pi-fw pi-home', routerLink: ['/'] }]
      },
      {
        label: 'Restaurante',
        icon: 'pi pi-utensils',
        visible: isAdmin || isCliente,
        items: [
          { label: 'Ordenes y Cuentas', icon: 'pi pi-shopping-bag', routerLink: ['/pages/restaurantes/cuenta'], visible: isAdmin || isCliente },
          { label: 'Facturación', icon: 'pi pi-credit-card', routerLink: ['/pages/restaurantes/facturas-rest'], visible: isAdmin || isCliente },
          { label: 'Catálogo', icon: 'pi pi-list', routerLink: ['/pages/restaurantes'], visible: isAdmin },
          { label: 'Platillos', icon: 'pi pi-apple', routerLink: ['/pages/restaurantes/platillos'], visible: isAdmin },
        ]
      },
      {
        label: 'Hotel',
        icon: 'pi pi-building',
        visible: isAdmin || isCliente,
        items: [
          { label: 'Reservas', icon: 'pi pi-calendar', routerLink: ['/pages/reserva'], visible: isAdmin || isCliente  },
          { label: 'Hoteles', icon: 'pi pi-briefcase', routerLink: ['/pages/hotel'], visible: isAdmin },
          { label: 'Habitaciones', icon: 'pi pi-home', routerLink: ['/pages/habitacion'], visible: isAdmin },
          { label: 'Facturas', icon: 'pi pi-file', routerLink: ['/pages/facturas'], visible: isAdmin || isCliente },
        ]
      },
      {
        label: 'Cliente',
        icon: 'pi pi-user',
        visible: isAdmin || isCliente,
        items: [
          { label: 'Reseña de Platillos', icon: 'pi pi-star', routerLink: ['/pages/review-platillo'], visible: isAdmin || isCliente },
          { label: 'Reseña de Hotel', icon: 'pi pi-star-fill', routerLink: ['/pages/review-hotel'], visible: isAdmin || isCliente },
          { label: 'Reviews de Platillos', icon: 'pi pi-comments', routerLink: ['/pages/reviews-platillos'] },
          { label: 'Reviews de Hoteles', icon: 'pi pi-comments', routerLink: ['/pages/reviews-hoteles'] },
        ]   
      },
      {
        label: 'Reportes',
        icon: 'pi pi-chart-line',
        visible: isAdmin,
        items: [
          { label: 'Popular Restaurante', icon: 'pi pi-chart-bar', routerLink: ['/pages/popular-rest'], visible: isAdmin },
          { label: 'Popular Habitación', icon: 'pi pi-chart-bar', routerLink: ['/pages/popular-habitacion'], visible: isAdmin },
          { label: 'Ingresos Restaurante', icon: 'pi pi-wallet', routerLink: ['/pages/ingresos-rest'], visible: isAdmin },
          { label: 'Dashboard', icon: 'pi pi-chart-pie', routerLink: ['/pages/reportes'], visible: isAdmin },
        ]
      },

      // Acceso
      {
        label: 'Acceso',
        icon: 'pi pi-fw pi-user',
        items: [
          { label: 'Login', icon: 'pi pi-fw pi-sign-in', routerLink: ['/auth/login'], visible: !isLogged },
          { label: 'Registro', icon: 'pi pi-fw pi-user-plus', routerLink: ['/pages/register'], visible: isAdmin },
          { label: 'Registro clientes', icon: 'pi pi-fw pi-user-plus', routerLink: ['/pages/register-clientes'], visible: !isLogged },
          // --- Cerrar sesión ---
          { label: 'Cerrar sesión', icon: 'pi pi-fw pi-sign-out', visible: isLogged, command: () => this.logout() }
        ]
      }
    ];

    this.model = full
      .map(g => ({ ...g, items: (g.items || []).filter(it => it.visible !== false) }))
      .filter(g => !g.items || g.items.length > 0);
  }

  private logout() {
    this.auth.clearToken();              // borra token y currentUser interno
    this.router.navigate(['/auth/login']);
  }
}