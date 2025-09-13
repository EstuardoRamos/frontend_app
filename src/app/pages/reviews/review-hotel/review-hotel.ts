// src/app/pages/reviews/review-hotel.component.ts
import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RatingModule } from 'primeng/rating';
import { TextareaModule } from 'primeng/textarea';
import { ButtonModule } from 'primeng/button';
import { ToolbarModule } from 'primeng/toolbar';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { ActivatedRoute, Router } from '@angular/router';
import { ReviewsService } from '@/services/reviews-service';
//mport { ReviewsService } from '@/services/reviews.service';

@Component({
  selector: 'app-review-hotel',
  standalone: true,
  imports: [CommonModule, FormsModule, RatingModule, TextareaModule, ButtonModule, ToolbarModule, ToastModule],
  providers: [MessageService],
  template: `
  <p-toolbar styleClass="mb-4">
    <ng-template #start><div class="text-lg font-semibold">Tu reseña del hotel</div></ng-template>
  </p-toolbar>

  <div class="card w-full md:w-2/3 lg:w-1/2 mx-auto">
    <div class="flex flex-col gap-4">
      <div>
        <div class="text-sm opacity-70 mb-1">Calificación</div>
        <p-rating [(ngModel)]="estrellas" [stars]="5"></p-rating>
        <small class="text-red-500" *ngIf="submitted && !estrellas">Selecciona de 1 a 5 estrellas.</small>
      </div>

      <div>
        <div class="text-sm opacity-70 mb-1">Comentario (opcional)</div>
        <textarea pTextarea rows="4" [(ngModel)]="comentario" [autoResize]="true" maxlength="500" class="w-full"></textarea>
        <div class="text-xs opacity-60 mt-1">{{(comentario||'').length}}/500</div>
      </div>

      <div>
        <div class="text-sm opacity-70 mb-1">Tags (opcional)</div>
        <p-chips [(ngModel)]="tags" placeholder="Ej: Limpieza, Ubicación, Servicio"></p-chips>
        <div class="text-xs opacity-60 mt-1">Presiona Enter para agregar cada tag.</div>
      </div>

      <div class="flex justify-end gap-2">
        <p-button label="Cancelar" text (onClick)="cancel()"></p-button>
        <p-button label="Enviar reseña" icon="pi pi-check" [loading]="loading" (onClick)="submit()"></p-button>
      </div>
    </div>
  </div>

  <p-toast />
  `
})
export class ReviewHotelComponent {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private svc = inject(ReviewsService);
  private toast = inject(MessageService);

  facturaHotelId = this.route.snapshot.queryParamMap.get('facturaHotelId') || '';

  estrellas = 0;
  comentario = '';
  tags: string[] = [];
  submitted = false;
  loading = false;

  submit() {
    this.submitted = true;
    if (!this.facturaHotelId || !this.estrellas) {
      this.toast.add({severity:'warn', summary:'Faltan datos', detail:'Selecciona estrellas (1–5).'});
      return;
    }
    if ((this.comentario || '').length > 500) {
      this.toast.add({severity:'warn', summary:'Comentario muy largo', detail:'Máximo 500 caracteres.'});
      return;
    }

    this.loading = true;
    this.svc.crearReviewHotel({
      facturaHotelId: this.facturaHotelId,
      estrellas: this.estrellas,
      comentario: this.comentario?.trim() || undefined,
      tags: (this.tags || []).map(t => t.trim()).filter(Boolean)
    }).subscribe({
      next: _ => {
        this.toast.add({severity:'success', summary:'¡Gracias!', detail:'Tu reseña fue enviada.'});
        this.router.navigateByUrl('/');
      },
      error: err => this.toast.add({severity:'error', summary:'Error', detail: err?.error?.message || 'No se pudo enviar'}),
      complete: () => this.loading = false
    });
  }

  cancel() { this.router.navigateByUrl('/'); }
}