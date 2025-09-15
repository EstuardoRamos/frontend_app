// src/app/pages/reviews/reviews-platillos-list.component.ts
import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { ToolbarModule } from 'primeng/toolbar';
import { SelectModule } from 'primeng/select';
import { ButtonModule } from 'primeng/button';
import { RatingModule } from 'primeng/rating';
import { ToastModule } from 'primeng/toast';
import { TagModule } from 'primeng/tag';
import { InputTextModule } from 'primeng/inputtext';
import { CardModule } from 'primeng/card';
import { DividerModule } from 'primeng/divider';
import { AvatarModule } from 'primeng/avatar';
import { MessageService } from 'primeng/api';

import { RestaurantesService } from '@/services/restaurante';
import { PlatillosService } from '@/services/platillo-service';
import { ReviewsService } from '@/services/reviews-service';
import { RestauranteDTO } from '@/interfaces/restaurante.model';
import { PlatilloDTO } from '@/interfaces/platillo.model';
import { ReviewPlatilloDTO } from '@/interfaces/reviews.interface';

@Component({
  selector: 'app-reviews-platillos-list',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    ToolbarModule, SelectModule, ButtonModule, RatingModule, ToastModule, TagModule, InputTextModule,
    CardModule, DividerModule, AvatarModule
  ],
  providers: [MessageService],
  template: `
  <p-toolbar styleClass="mb-4">
    <ng-template #start>
      <div class="flex flex-wrap items-end gap-3">
        <p-select class="w-20rem"
          [(ngModel)]="restauranteId"
          [options]="restOptions"
          optionLabel="label" optionValue="value"
          placeholder="Selecciona restaurante"
          (onChange)="onRestChange()" />

        <p-select class="w-20rem"
          [(ngModel)]="platilloId"
          [options]="platillosOptions"
          optionLabel="label" optionValue="value"
          placeholder="Selecciona platillo" />

        <p-button label="Cargar reviews" icon="pi pi-search" (onClick)="load()" />

        <span class="ml-3 text-sm opacity-80" *ngIf="filtered().length">
          Promedio: <b>{{ avg() | number:'1.1-2' }}</b> ·
          Reviews: <b>{{ filtered().length }}</b>
        </span>
      </div>
    </ng-template>

    <ng-template #end>
      <div class="flex items-center gap-2">
        <input pInputText type="text" class="w-16rem" [(ngModel)]="q" (input)="applyFilter()" placeholder="Buscar (comentario, cliente, cuenta)" />
        <p-tag [value]="filtered().length + ' resultados'"></p-tag>
      </div>
    </ng-template>
  </p-toolbar>

  <!-- Empty state -->
  <div class="card text-center p-6" *ngIf="loaded && !filtered().length">
    <div class="text-2xl font-semibold mb-1">Sin reseñas</div>
    <div class="opacity-70">Selecciona restaurante y platillo y presiona “Cargar reviews”.</div>
  </div>

  <!-- Listado tipo comentarios -->
  <div class="grid grid-cols-12 gap-4" *ngIf="filtered().length">
    <div class="col-span-12 lg:col-span-8 mx-auto w-full">
      <p-card *ngFor="let r of filtered(); trackBy: trackId" class="mb-4">
        <ng-template #title>
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-3">
              <p-avatar label="{{avatarLabel(r)}}" shape="circle" class="shadow-1"></p-avatar>
              <div>
                <div class="font-semibold">
                  {{ r.clienteId ? (r.clienteId | slice:0:8) + '…' : 'Cliente' }}
                  <p-tag class="ml-2" [value]="r.enabled ? 'ACTIVA' : 'INACTIVA'" [severity]="r.enabled ? 'success' : 'danger'"></p-tag>
                </div>
                <div class="text-xs opacity-70">
                  Cuenta: {{ r.cuentaId | slice:0:8 }}… · {{ r.createdAt | date:'medium' }}
                </div>
              </div>
            </div>
            <p-rating
              [readonly]="true"
              [stars]="5"
              [(ngModel)]="r.estrellas">
            </p-rating>
          </div>
        </ng-template>

        <ng-template #content>
          <div class="whitespace-pre-wrap leading-6" *ngIf="r.comentario; else sinComentario">
            {{ r.comentario }}
          </div>
          <ng-template #sinComentario>
            <span class="opacity-60 italic">Sin comentario.</span>
          </ng-template>

          <p-divider styleClass="my-3"></p-divider>

          <div class="text-xs opacity-70 flex flex-wrap gap-4">
            <span><i class="pi pi-hashtag mr-1"></i>Review: {{ r.id | slice:0:8 }}…</span>
            <span><i class="pi pi-building mr-1"></i>Restaurante: {{ r.restauranteId | slice:0:8 }}…</span>
            <span><i class="pi pi-apple mr-1"></i>Platillo: {{ r.platilloId | slice:0:8 }}…</span>
          </div>
        </ng-template>
      </p-card>
    </div>
  </div>

  <p-toast />
  `
})
export class ReviewsPlatillosListComponent implements OnInit {
  private restSvc = inject(RestaurantesService);
  private platillosSvc = inject(PlatillosService);
  private reviewsSvc = inject(ReviewsService);
  private toast = inject(MessageService);

  restauranteId = '';
  platilloId = '';
  restOptions: { label: string; value: string }[] = [];
  platillosOptions: { label: string; value: string }[] = [];

  private _reviews = signal<ReviewPlatilloDTO[]>([]);
  reviews = computed(() => this._reviews());
  q = '';
  filtered = signal<ReviewPlatilloDTO[]>([]);
  loaded = false;

  avg = computed(() => {
    const arr = this.filtered();
    if (!arr.length) return 0;
    const s = arr.reduce((a, b) => a + (b.estrellas || 0), 0);
    return s / arr.length;
  });

  ngOnInit(): void {
    this.restSvc.listarTodos().subscribe({
      next: (rs: RestauranteDTO[]) => {
        this.restOptions = (rs ?? []).map(r => ({ label: r.nombre, value: r.id }));
      }
    });
  }

  onRestChange() {
    this.platillosOptions = [];
    this.platilloId = '';
    if (!this.restauranteId) return;

    this.platillosSvc.listarTodos(this.restauranteId).subscribe({
      next: (ps: PlatilloDTO[]) => {
        this.platillosOptions = (ps ?? [])
          .filter(p => p.enabled !== false)
          .map(p => ({ label: `${p.nombre} (${(p.precio ?? 0).toFixed?.(2) || p.precio})`, value: p.id }));
      }
    });
  }

  load() {
    if (!this.platilloId) {
      this.toast.add({ severity: 'warn', summary: 'Faltan datos', detail: 'Selecciona un platillo.' });
      return;
    }
    this.reviewsSvc.listarReviewsPlatillo(this.platilloId, 0, 100).subscribe({
      next: (arr) => { this._reviews.set(arr ?? []); this.applyFilter(); this.loaded = true; },
      error: (_) => { this.toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar reviews' }); this.loaded = true; }
    });
  }

  applyFilter() {
    const q = (this.q || '').toLowerCase().trim();
    if (!q) { this.filtered.set(this.reviews()); return; }

    const fil = this.reviews().filter(r => {
      const t1 = (r.comentario || '').toLowerCase();
      const t2 = (r.cuentaId || '').toLowerCase();
      const t3 = (r.clienteId || '').toLowerCase();
      return t1.includes(q) || t2.includes(q) || t3.includes(q);
    });
    this.filtered.set(fil);
  }

  avatarLabel(r: ReviewPlatilloDTO) {
    // Iniciales simples según clienteId, para no depender de nombres reales
    const base = (r.clienteId || 'CL').replace(/-/g,'').toUpperCase();
    return base.slice(0, 2);
  }

  trackId(_: number, r: ReviewPlatilloDTO) { return r.id; }
}