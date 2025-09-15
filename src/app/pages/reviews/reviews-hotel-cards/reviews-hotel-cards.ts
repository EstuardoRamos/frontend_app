// src/app/pages/reviews/reviews-hotel-cards.component.ts
import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { ToolbarModule } from 'primeng/toolbar';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { RatingModule } from 'primeng/rating';
import { TagModule } from 'primeng/tag';
import { PanelModule } from 'primeng/panel';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';

import { HotelesService } from '@/services/hotel';
import { ReviewsService } from '@/services/reviews-service';
import { HotelDTO } from '@/interfaces/hotel.model';
import { PromedioHotelResp, ReviewHotelDTO } from '@/interfaces/reviews.interface';



@Component({
  selector: 'app-reviews-hotel-cards',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    ToolbarModule, InputTextModule, ButtonModule, CardModule, RatingModule, TagModule, PanelModule, ToastModule
  ],
  providers: [MessageService],
  template: `
  <p-toolbar styleClass="mb-4">
    <ng-template #start>
      <div class="flex flex-wrap items-end gap-3">
        <span class="text-lg font-semibold">Reseñas de hoteles</span>
      </div>
    </ng-template>
    <ng-template #end>
      <div class="flex items-center gap-3">
        <input pInputText class="w-16rem" [(ngModel)]="q" (input)="applyFilter()" placeholder="Buscar hotel..." />
        <div class="flex items-center gap-2">
          <span class="text-sm opacity-80">Mín. promedio</span>
          <p-rating [ngModel]="minStars" [readonly]="false"  (onRate)="setMinStars($event.value)"></p-rating>
        </div>
      </div>
    </ng-template>
  </p-toolbar>

  <div class="grid grid-cols-12 gap-4">
    @for (h of filteredHotels(); track h.id) {
      <div class="col-span-12 md:col-span-6 xl:col-span-4">
        <p-card>
          <ng-template #header>
            <div class="flex items-center justify-between">
              <div class="text-xl font-semibold">{{ h.nombre }}</div>
              <p-tag value="Hotel" severity="info" />
            </div>
          </ng-template>

          <div class="mt-2 space-y-2">
            <div class="flex items-center gap-2">
              <p-rating [ngModel]="promedioMap[h.id]?.promedio || 0" [readonly]="true" ></p-rating>
              <span class="text-sm opacity-80">
                {{ (promedioMap[h.id]?.promedio || 0) | number:'1.1-2' }} ·
                {{ promedioMap[h.id]?.total || 0 }} reseña(s)
              </span>
            </div>
            <div class="text-sm opacity-80">ID: <span class="font-mono">{{ h.id | slice:0:8 }}...</span></div>
          </div>

          <ng-template #footer>
            <div class="flex justify-between">
              <p-button label="Ver reseñas" icon="pi pi-comments"
                        [outlined]="true"
                        (onClick)="toggleHotel(h.id)"/>
              <p-button label="Actualizar promedio" icon="pi pi-refresh"
                        severity="secondary" [text]="true"
                        (onClick)="loadPromedio(h.id)"/>
            </div>

            <p-panel [toggleable]="true" [collapsed]="!expanded[h.id]" class="mt-3" (onBeforeExpand)="ensureLoaded(h.id)">
              <ng-template #header>
                <div class="flex items-center gap-2">
                  <i class="pi pi-comment"></i>
                  <span>Comentarios</span>
                </div>
              </ng-template>

              <!-- Loading -->
              <div *ngIf="loadingReviews[h.id]" class="p-3 text-sm opacity-70">Cargando reseñas...</div>

              <!-- Lista de reseñas como “comentarios” -->
              <div class="flex flex-col gap-3" *ngIf="!loadingReviews[h.id]">
                <div *ngIf="(reviewsMap[h.id] || []).length === 0" class="p-3 text-sm opacity-70">
                  Aún no hay reseñas para este hotel.
                </div>

                <div *ngFor="let r of (reviewsMap[h.id] || [])" class="border rounded-lg p-3">
                  <div class="flex items-center justify-between mb-1">
                    <div class="flex items-center gap-2">
                      <p-rating [ngModel]="r.estrellas" [readonly]="true" ></p-rating>
                      <span class="text-xs opacity-70">{{ r.createdAt | date:'medium' }}</span>
                    </div>
                    <p-tag [value]="r.enabled ? 'ACTIVA' : 'INACTIVA'" [severity]="r.enabled ? 'success' : 'danger'"></p-tag>
                  </div>

                  <div class="text-sm whitespace-pre-wrap" *ngIf="r.comentario; else noCom">
                    {{ r.comentario }}
                  </div>
                  <ng-template #noCom>
                    <div class="text-sm opacity-70">Sin comentario.</div>
                  </ng-template>

                  <div class="flex flex-wrap gap-2 mt-2" *ngIf="r.tags?.length">
                    <span *ngFor="let t of r.tags" class="text-xs px-2 py-1 rounded-full border">
                      #{{ t }}
                    </span>
                  </div>

                  <div class="mt-2 text-xs opacity-70">
                    <span *ngIf="r.clienteId">Cliente: <span class="font-mono">{{ r.clienteId | slice:0:8 }}...</span> · </span>
                    <span *ngIf="r.facturaHotelId">Factura: <span class="font-mono">{{ r.facturaHotelId | slice:0:8 }}...</span></span>
                  </div>
                </div>
              </div>
            </p-panel>
          </ng-template>
        </p-card>
      </div>
    }
  </div>

  <p-toast />
  `
})
export class ReviewsHotelCardsComponent implements OnInit {
  private hotelesSvc = inject(HotelesService);
  private reviewsSvc = inject(ReviewsService);
  private toast = inject(MessageService);

  // estado UI
  q = '';
  minStars = 0;

  // datos base
  private hotels = signal<HotelDTO[]>([]);
  filteredHotels = computed(() => {
    const q = (this.q || '').trim().toLowerCase();
    const arr = this.hotels().filter(h => !q || (h.nombre || '').toLowerCase().includes(q));
    // filtra por mínimo de estrellas usando cache de promedios
    return arr.filter(h => {
      const p = this.promedioMap[h.id];
      const val = p?.promedio ?? 0;
      return val >= this.minStars;
    });
  });

  // caches
  promedioMap: Record<string, PromedioHotelResp> = {};
  reviewsMap: Record<string, ReviewHotelDTO[]> = {};
  loadingReviews: Record<string, boolean> = {};
  expanded: Record<string, boolean> = {};

  ngOnInit(): void {
    this.hotelesSvc.listar().subscribe({
      next: (hs: HotelDTO[]) => {
        this.hotels.set(hs ?? []);
        // precargar promedios (opcional). Si prefieres “on demand”, comenta el loop.
        (hs ?? []).forEach(h => this.loadPromedio(h.id, /*silent=*/true));
      },
      error: _ => this.toast.add({severity:'error', summary:'Error', detail:'No se pudieron cargar hoteles'})
    });
  }

  applyFilter() { /* computed ya reacciona a q */ }
  setMinStars(n: number) { this.minStars = n || 0; }

  toggleHotel(hotelId: string) {
    this.expanded[hotelId] = !this.expanded[hotelId];
    if (this.expanded[hotelId]) this.ensureLoaded(hotelId);
  }

  ensureLoaded(hotelId: string) {
    if (!this.promedioMap[hotelId]) this.loadPromedio(hotelId, /*silent=*/true);
    if (!this.reviewsMap[hotelId]) this.loadReviews(hotelId);
  }

  loadPromedio(hotelId: string, silent = false) {
    // ReviewsService debe exponer: promedioHotel(hotelId: string)
    this.reviewsSvc.promedioHotel(hotelId).subscribe({
      next: (p) => this.promedioMap[hotelId] = p,
      error: _ => !silent && this.toast.add({severity:'error', summary:'Error', detail:'No se pudo cargar el promedio'})
    });
  }

  loadReviews(hotelId: string) {
    this.loadingReviews[hotelId] = true;
    // ReviewsService debe exponer: listarReviewsHotel(hotelId: string, page=0, size=100)
    this.reviewsSvc.listarReviewsHotel(hotelId, 0, 100).subscribe({
      next: (arr) => this.reviewsMap[hotelId] = arr ?? [],
      error: _ => this.toast.add({severity:'error', summary:'Error', detail:'No se pudieron cargar reseñas'}),
      complete: () => this.loadingReviews[hotelId] = false
    });
  }
}