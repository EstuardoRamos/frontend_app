// src/app/pages/reviews/reviews-platillos-por-cuenta.component.ts
import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ToolbarModule } from 'primeng/toolbar';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { RatingModule } from 'primeng/rating';
import { TextareaModule } from 'primeng/textarea';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';

import { CuentasService } from '@/services/cuenta-service';
import { ReviewsService } from '@/services/reviews-service';
import { ConsumoDTO } from '@/interfaces/cuenta.model';

type ReviewCreada = {
  id: string;
  cuentaId: string;
  restauranteId: string;
  platilloId: string;
  clienteId: string;
  estrellas: number;
  comentario?: string;
  createdAt: string;
  updatedAt: string;
};

@Component({
  selector: 'app-reviews-platillos-por-cuenta',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    ToolbarModule, InputTextModule, ButtonModule, TableModule, RatingModule, TextareaModule, ToastModule
  ],
  providers: [MessageService],
  template: `
  <p-toolbar styleClass="mb-4">
    <ng-template #start>
      <div class="flex items-end gap-3">
        <div>
          <label class="block font-semibold mb-1">Número de cuenta</label>
          <input pInputText class="w-20rem" [(ngModel)]="cuentaId" placeholder="Ej. 44b2c231-..." />
        </div>
        <p-button label="Buscar consumos" icon="pi pi-search" (onClick)="buscar()" />
      </div>
    </ng-template>
  </p-toolbar>

  <div class="card" *ngIf="consumosFiltrados().length">
    <p-table [value]="consumosFiltrados()">
      <ng-template #header>
        <tr>
          <th>Platillo</th>
          <th class="text-right">P.Unit</th>
          <th class="text-right">Cant.</th>
          <th class="text-right">Subt.</th>
          <th>Estrellas</th>
          <th>Comentario</th>
          <th style="width: 9.5rem"></th>
        </tr>
      </ng-template>
      <ng-template #body let-x>
        <tr>
          <td class="font-medium">{{ x.nombre }}</td>
          <td class="text-right">{{ x.precioUnitario | number:'1.2-2' }}</td>
          <td class="text-right">{{ x.cantidad }}</td>
          <td class="text-right">{{ x.subtotal | number:'1.2-2' }}</td>
          <td>
            <p-rating [(ngModel)]="form[x.id].estrellas" [stars]="5" [readonly]="bloquearTodo || sending[x.id]"></p-rating>
          </td>
          <td>
            <textarea pTextarea rows="2" class="w-20rem"
              [(ngModel)]="form[x.id].comentario" maxlength="500" [autoResize]="true"
              [readonly]="bloquearTodo || sending[x.id]"></textarea>
          </td>
          <td class="text-right">
            <p-button label="Enviar" icon="pi pi-check" size="small"
              [loading]="!!sending[x.id]"
              [disabled]="bloquearTodo || !puedeEnviar(x) || !!sending[x.id]"
              (onClick)="enviarUno(x)" />
          </td>
        </tr>
      </ng-template>
    </p-table>

    <div class="mt-3 text-right">
      <p-button label="Enviar todas" icon="pi pi-send"
        [disabled]="bloquearTodo || !hayAlMenosUnaValida() || enviandoTodas"
        [loading]="enviandoTodas"
        (onClick)="enviarTodas()" />
    </div>
  </div>

  <!-- Resúmen de reseñas creadas -->
  <div class="card mt-4" *ngIf="creadas.length">
    <div class="font-semibold mb-2">Reseñas creadas</div>
    <p-table [value]="creadas">
      <ng-template #header>
        <tr>
          <th>PlatilloId</th>
          <th>Estrellas</th>
          <th>Comentario</th>
          <th>Fecha</th>
        </tr>
      </ng-template>
      <ng-template #body let-r>
        <tr>
          <td>{{ r.platilloId }}</td>
          <td>{{ r.estrellas }}</td>
          <td>{{ r.comentario || '—' }}</td>
          <td>{{ r.createdAt | date:'short' }}</td>
        </tr>
      </ng-template>
    </p-table>
  </div>

  <p-toast />
  `
})
export class ReviewsPlatillosPorCuentaComponent {
  private cuentasSvc = inject(CuentasService);
  private reviewsSvc = inject(ReviewsService);
  private toast = inject(MessageService);

  cuentaId = '';
  consumos: ConsumoDTO[] = [];

  // estado UI
  sending: Record<string, boolean> = {};
  sent = new Set<string>();
  enviandoTodas = false;
  bloquearTodo = false;

  // form por id de consumo
  form: Record<string, { estrellas: number; comentario: string }> = {};

  // reseñas creadas para mostrar
  creadas: ReviewCreada[] = [];

  buscar() {
    const id = (this.cuentaId || '').trim();
    if (!id) {
      this.toast.add({severity:'warn', summary:'Cuenta requerida', detail:'Ingresa un número de cuenta.'});
      return;
    }
    this.bloquearTodo = false;
    this.sent.clear();
    this.sending = {};
    this.creadas = [];

    this.cuentasSvc.listarConsumos(id).subscribe({
      next: (arr) => {
        this.consumos = arr ?? [];
        this.form = {};
        this.consumos.forEach(c => this.form[c.id] = { estrellas: 0, comentario: '' });
        if (!this.consumos.length) {
          this.toast.add({severity:'info', summary:'Sin consumos', detail:'La cuenta no tiene consumos.'});
        }
      },
      error: _ => this.toast.add({severity:'error', summary:'Error', detail:'No se pudieron cargar los consumos'})
    });
  }

  consumosFiltrados() {
    // oculta los que ya se enviaron
    return this.consumos.filter(c => !this.sent.has(c.id));
  }

  puedeEnviar(x: ConsumoDTO) {
    const f = this.form[x.id];
    return !!f && f.estrellas >= 1 && f.estrellas <= 5;
  }

  enviarUno(x: ConsumoDTO) {
    if (!this.puedeEnviar(x)) {
      this.toast.add({severity:'warn', summary:'Faltan datos', detail:'Selecciona de 1 a 5 estrellas.'});
      return;
    }
    const f = this.form[x.id];
    this.sending[x.id] = true;

    this.reviewsSvc.crearReviewPlatillo({
      cuentaId: this.cuentaId,
      platilloId: x.platilloId!,
      estrellas: f.estrellas,
      comentario: (f.comentario || '').trim() || undefined
    }).subscribe({
      next: (created  => {
        this.sent.add(x.id);                 // oculta fila
        this.creadas.unshift(created as  ReviewCreada);       // muestra resumen
        this.toast.add({severity:'success', summary:'Review creada', detail:`«${x.nombre}» calificado.`});
      }),
      error: (err) => {
        if (err?.status === 409) {
          this.toast.add({severity:'error', summary:'Error', detail:'Error: los platillos de esta cuenta ya han sido calificados, por favor.'});
          this.bloquearTodo = true;          // bloquea todo si ya están calificadas
        } else {
          this.toast.add({severity:'error', summary:'Error', detail: err?.error?.message || 'No se pudo enviar'});
        }
      },
      complete: () => { this.sending[x.id] = false; }
    });
  }

  hayAlMenosUnaValida() {
    return this.consumosFiltrados().some(c => this.puedeEnviar(c));
  }

  enviarTodas() {
    const pendientes = this.consumosFiltrados().filter(c => this.puedeEnviar(c));
    if (!pendientes.length) return;
    this.enviandoTodas = true;

    const enviarIdx = (i: number) => {
      if (i >= pendientes.length) {
        this.enviandoTodas = false;
        this.toast.add({severity:'success', summary:'Listo', detail:'Se enviaron las reseñas válidas.'});
        return;
      }
      const x = pendientes[i];
      const f = this.form[x.id];
      this.sending[x.id] = true;

      this.reviewsSvc.crearReviewPlatillo({
        cuentaId: this.cuentaId,
        platilloId: x.platilloId!,
        estrellas: f.estrellas,
        comentario: (f.comentario || '').trim() || undefined
      }).subscribe({
        next: (created) => {
          this.sent.add(x.id);
          this.creadas.unshift(created as ReviewCreada);
          enviarIdx(i + 1);
        },
        error: (err) => {
          if (err?.status === 409) {
            this.toast.add({severity:'error', summary:'Error', detail:'Error: los platillos de esta cuenta ya han sido calificados, por favor.'});
            this.bloquearTodo = true;
            this.enviandoTodas = false;
          } else {
            this.toast.add({severity:'error', summary:'Error', detail:`Fallo reseña de «${x.nombre}».`});
            enviarIdx(i + 1);
          }
        },
        complete: () => { this.sending[x.id] = false; }
      });
    };

    enviarIdx(0);
  }
}