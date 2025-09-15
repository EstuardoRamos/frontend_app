import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ToolbarModule } from 'primeng/toolbar';
import { SelectModule } from 'primeng/select';
import { DatePickerModule } from 'primeng/datepicker';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { TableModule } from 'primeng/table';
import { MessageService } from 'primeng/api';

import { ReportesService } from '@/services/reportes.service';
import { RestaurantesService } from '@/services/restaurante';
import { IngresosRestResp } from '@/interfaces/reportes.model';

@Component({
  standalone: true,
  selector: 'app-ingresos-restaurante',
  imports: [CommonModule, FormsModule, ToolbarModule, SelectModule, DatePickerModule, ButtonModule, ToastModule, TableModule],
  providers: [MessageService],
  template: `
  <p-toolbar styleClass="mb-4">
    <ng-template #start>
      <div class="flex flex-wrap items-end gap-3">
        <p-select class="w-20rem" [(ngModel)]="restauranteId" [options]="restOptions" optionLabel="label" optionValue="value" placeholder="Restaurante" />
        <p-datepicker [(ngModel)]="range" selectionMode="range" dateFormat="yy-mm-dd" placeholder="(Opcional) Rango" />
        <p-button label="Consultar" icon="pi pi-search" (onClick)="load()" />
      </div>
    </ng-template>
  </p-toolbar>

  <div class="card" *ngIf="data() as d">
    <div class="text-xl font-semibold mb-3">Total ingresos: {{ d.total | number:'1.2-2' }}</div>

    <p-table [value]="d.facturas" [paginator]="true" [rows]="10">
      <ng-template #header>
        <tr>
          <th>Fecha</th><th>Cuenta</th><th class="text-right">Subtotal</th>
          <th class="text-right">Impuesto</th><th class="text-right">Propina</th><th class="text-right">Total</th><th>Estado</th>
        </tr>
      </ng-template>
      <ng-template #body let-f>
        <tr>
          <td>{{ f.createdAt | date:'yyyy-MM-dd HH:mm' }}</td>
          <td>{{ f.cuentaId | slice:0:8 }}...</td>
          <td class="text-right">{{ f.subtotal | number:'1.2-2' }}</td>
          <td class="text-right">{{ f.impuesto | number:'1.2-2' }}</td>
          <td class="text-right">{{ f.propina | number:'1.2-2' }}</td>
          <td class="text-right font-semibold">{{ f.total | number:'1.2-2' }}</td>
          <td>{{ f.estado }}</td>
        </tr>
      </ng-template>
    </p-table>
  </div>

  <p-toast />
  `
})
export class IngresosRestauranteComponent implements OnInit {
  private svc = inject(ReportesService);
  private restSvc = inject(RestaurantesService);
  private toast = inject(MessageService);

  restOptions: {label:string,value:string}[] = [];
  restauranteId = '';
  range: Date[] | null = null;

  data = signal<IngresosRestResp | null>(null);

  ngOnInit(): void {
    this.restSvc.listarTodos().subscribe(rs => {
      this.restOptions = (rs ?? []).map(r => ({label:r.nombre, value:r.id}));
    });
  }

  load() {
    if (!this.restauranteId) {
      this.toast.add({severity:'warn', summary:'Requerido', detail:'Selecciona un restaurante.'});
      return;
    }
    const [d,h] = this.normalizeRange(this.range);
    this.svc.ingresosRestaurante(this.restauranteId, d, h).subscribe({
      next: resp => this.data.set(resp),
      error: _ => this.toast.add({severity:'error', summary:'Error', detail:'No se pudo cargar el reporte'})
    });
  }

  private normalizeRange(range: Date[] | null): [string|undefined, string|undefined] {
    if (!range || range.length < 2) return [undefined, undefined];
    const pad = (n:number)=> n.toString().padStart(2,'0');
    const toYMD = (d:Date)=>`${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
    return [toYMD(range[0]), toYMD(range[1])];
  }
}