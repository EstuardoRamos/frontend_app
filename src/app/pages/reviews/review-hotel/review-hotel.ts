// src/app/pages/reviews/review-hotel.component.ts
import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ToolbarModule } from 'primeng/toolbar';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { ButtonModule } from 'primeng/button';
import { RatingModule } from 'primeng/rating';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { ReviewsService } from '@/services/reviews-service';

@Component({
  selector: 'app-review-hotel',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    ToolbarModule, InputTextModule, TextareaModule,
    ButtonModule, RatingModule, TagModule, ToastModule
  ],
  providers: [MessageService],
  template: `
  <p-toolbar styleClass="mb-4">
    <ng-template #start><div class="text-lg font-semibold">Tu reseña del hotel</div></ng-template>
  </p-toolbar>

  <div class="card w-full md:w-2/3 lg:w-1/2 mx-auto flex flex-col gap-4">
    <div class="grid grid-cols-12 gap-4">
      <div class="col-span-12">
        <label class="block font-semibold mb-1">Factura de hotel (ID)</label>
        <input pInputText [(ngModel)]="facturaHotelId" placeholder="Ej. 47ab4005-..." />
        <small class="text-red-500" *ngIf="submitted && !facturaHotelId">Obligatorio.</small>
      </div>

      <div class="col-span-12">
        <label class="block font-semibold mb-1">Calificación</label>
        <p-rating [(ngModel)]="estrellas" [stars]="5"></p-rating>
        <small class="text-red-500" *ngIf="submitted && (!estrellas || estrellas<1)">Selecciona de 1 a 5 estrellas.</small>
      </div>

      <div class="col-span-12">
        <label class="block font-semibold mb-1">Comentario (opcional)</label>
        <textarea pTextarea rows="4" [(ngModel)]="comentario" [autoResize]="true" maxlength="500" class="w-full"></textarea>
        <div class="text-xs opacity-60 mt-1">{{ (comentario||'').length }}/500</div>
      </div>

      <div class="col-span-12">
        <label class="block font-semibold mb-1">Tags (opcional)</label>
        <div class="flex gap-2">
          <input pInputText class="flex-1" [(ngModel)]="tagInput" placeholder="Ej. Limpieza, Atención, Desayuno" (keyup.enter)="addTag()" />
          <p-button label="Agregar" icon="pi pi-plus" (onClick)="addTag()"></p-button>
        </div>
        <div class="flex flex-wrap gap-2 mt-2" *ngIf="tags.length">
          <p-tag *ngFor="let t of tags; let i = index" [value]="t">
          </p-tag>
          <span *ngFor="let t of tags; let i = index">
            <p-button size="small" text icon="pi pi-times" (onClick)="removeTag(i)"></p-button>
          </span>
        </div>
        <small class="text-xs opacity-60">Presiona Enter o “Agregar” para sumar cada tag. Máx 10.</small>
      </div>
    </div>

    <div class="flex justify-end gap-2">
      <p-button label="Cancelar" text (onClick)="reset()"></p-button>
      <p-button label="Enviar reseña" icon="pi pi-check" [loading]="loading" (onClick)="submit()"></p-button>
    </div>
  </div>

  <p-toast />
  `
})
export class ReviewHotelComponent {
  private svc = inject(ReviewsService);
  private toast = inject(MessageService);

  facturaHotelId = '';
  estrellas = 0;
  comentario = '';
  tagInput = '';
  tags: string[] = [];

  submitted = false;
  loading = false;

  addTag() {
    const t = (this.tagInput || '').trim();
    if (!t) return;
    if (this.tags.length >= 10) {
      this.toast.add({severity:'warn', summary:'Límite de tags', detail:'Máximo 10 etiquetas.'});
      return;
    }
    if (!this.tags.includes(t)) this.tags.push(t);
    this.tagInput = '';
  }

  removeTag(i: number) { this.tags.splice(i, 1); }

  submit() {
    this.submitted = true;
    if (!this.facturaHotelId || !this.estrellas || this.estrellas < 1) {
      this.toast.add({severity:'warn', summary:'Faltan datos', detail:'Factura y estrellas son obligatorios.'});
      return;
    }
    if ((this.comentario || '').length > 500) {
      this.toast.add({severity:'warn', summary:'Comentario muy largo', detail:'Máximo 500 caracteres.'});
      return;
    }

    this.loading = true;
    this.svc.crearReviewHotel({
      facturaHotelId: this.facturaHotelId.trim(),
      estrellas: this.estrellas,
      comentario: this.comentario?.trim() || undefined,
      tags: this.tags
    }).subscribe({
      next: _ => {
        this.toast.add({severity:'success', summary:'¡Gracias!', detail:'Tu reseña fue enviada.'});
        this.reset();
      },
      error: err => {
        this.toast.add({severity:'error', summary:'Error', detail: err?.error?.message || 'No se pudo enviar'});
        this.loading = false;
      },
      complete: () => this.loading = false
    });
  }

  reset() {
    this.submitted = false;
    this.loading = false;
    this.facturaHotelId = '';
    this.estrellas = 0;
    this.comentario = '';
    this.tagInput = '';
    this.tags = [];
  }
}