import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ToolbarModule } from 'primeng/toolbar';
import { SelectModule } from 'primeng/select';
import { DatePickerModule } from 'primeng/datepicker';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { MessageService } from 'primeng/api';

import { ReportesService } from '@/services/reportes.service';
import { RestaurantesService } from '@/services/restaurante';
import { RestauranteDTO } from '@/interfaces/restaurante.model';
import { PopularRestauranteResp } from '@/interfaces/reportes.model';

@Component({
  standalone: true,
  selector: 'app-popular-restaurante',
  imports: [CommonModule, FormsModule, ToolbarModule, SelectModule, DatePickerModule, ButtonModule, ToastModule, TableModule, TagModule],
  providers: [MessageService],
  template: `
  <p-toolbar styleClass="mb-4">
    <ng-template #start>
      <div class="flex flex-wrap items-end gap-3">
        <p-select class="w-20rem" [(ngModel)]="restauranteId" [options]="restOptions" optionLabel="label" optionValue="value" placeholder="(Opcional) Filtrar restaurante"/>
        <p-datepicker [(ngModel)]="range" selectionMode="range" dateFormat="yy-mm-dd" placeholder="Rango de fechas" />
        <p-button label="Consultar" icon="pi pi-search" (onClick)="load()" />
      </div>
    </ng-template>
  </p-toolbar>

  <div class="grid grid-cols-12 gap-4" *ngIf="data() as d">
    <div class="col-span-12 md:col-span-4">
      <div class="p-4 border rounded-xl">
        <div class="text-sm opacity-70">Top restaurante</div>
        <div class="text-xl font-semibold mt-1">{{ mapRest(d.top.restauranteId) }}</div>
        <div class="mt-3 space-y-1">
          <div>Ingresos: <b>{{ d.top.ingresos | number:'1.2-2' }}</b></div>
          <div>Facturas: <b>{{ d.top.facturas }}</b></div>
        </div>
        <div class="text-xs opacity-60 mt-3">Período: {{ d.desde }} → {{ d.hasta }}</div>
      </div>
    </div>

    <div class="col-span-12 md:col-span-8">
      <div class="p-4 border rounded-xl">
        <div class="font-semibold mb-3">Ranking por ingresos</div>
        <p-table [value]="d.ranking">
          <ng-template #header>
            <tr><th>Restaurante</th><th class="text-right">Ingresos</th></tr>
          </ng-template>
          <ng-template #body let-r>
            <tr>
              <td>{{ mapRest(r.restauranteId) }}</td>
              <td class="text-right">{{ r.ingresos | number:'1.2-2' }}</td>
            </tr>
          </ng-template>
        </p-table>
      </div>
    </div>

    <div class="col-span-12">
      <div class="p-4 border rounded-xl">
        <div class="font-semibold mb-3">Facturas del período</div>
        <p-table [value]="d.facturas" [paginator]="true" [rows]="10">
          <ng-template #header>
            <tr>
              <th>Fecha</th><th>Restaurante</th><th class="text-right">Subtotal</th>
              <th class="text-right">Impuesto</th><th class="text-right">Propina</th><th class="text-right">Total</th><th>Estado</th>
            </tr>
          </ng-template>
          <ng-template #body let-f>
            <tr>
              <td>{{ f.createdAt | date:'yyyy-MM-dd HH:mm' }}</td>
              <td>{{ mapRest(f.restauranteId) }}</td>
              <td class="text-right">{{ f.subtotal | number:'1.2-2' }}</td>
              <td class="text-right">{{ f.impuesto | number:'1.2-2' }}</td>
              <td class="text-right">{{ f.propina | number:'1.2-2' }}</td>
              <td class="text-right font-semibold">{{ f.total | number:'1.2-2' }}</td>
              <td><p-tag [value]="f.estado" [severity]="f.estado==='EMITIDA'?'success':'warning'" /></td>
            </tr>
          </ng-template>
        </p-table>
      </div>
    </div>
  </div>

  <p-toast />
  `
})
export class PopularRestauranteComponent implements OnInit {
  private svc = inject(ReportesService);
  private restaurantesSvc = inject(RestaurantesService);
  private toast = inject(MessageService);

  restOptions: {label:string, value:string}[] = [];
  restMap: Record<string,string> = {};
  restauranteId?: string;
  range: Date[] | null = null;

  data = signal<PopularRestauranteResp | null>(null);

  ngOnInit(): void {
    this.restaurantesSvc.listarTodos().subscribe(rs => {
      const arr = rs ?? [];
      this.restOptions = arr.map(r => ({label:r.nombre, value:r.id}));
      this.restMap = arr.reduce((a,r)=> (a[r.id]=r.nombre, a), {} as Record<string,string>);
    });
  }

  mapRest(id:string){ return this.restMap[id] || id; }

  load(){
    const [d,h] = this.normalizeRange(this.range);
    this.svc.popularRestaurante(d, h, this.restauranteId).subscribe({
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