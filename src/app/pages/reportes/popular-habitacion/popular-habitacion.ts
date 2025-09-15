// src/app/pages/reportes/popular-habitacion.component.ts
import { Component, OnInit, inject, signal } from '@angular/core';
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
import { HotelesService } from '@/services/hotel';
import { HabitacionesService } from '@/services/habitacion'; // <-- NUEVO
import { HotelDTO } from '@/interfaces/hotel.model';
import { PopularHabitacionResp } from '@/interfaces/reportes.model';
import { HabitacionDTO } from '@/interfaces/habitacion.model'; // <-- NUEVO

@Component({
  standalone: true,
  selector: 'app-popular-habitacion',
  imports: [CommonModule, FormsModule, ToolbarModule, SelectModule, DatePickerModule, ButtonModule, ToastModule, TableModule],
  providers: [MessageService],
  template: `
  <p-toolbar styleClass="mb-4">
    <ng-template #start>
      <div class="flex flex-wrap items-end gap-3">
        <p-select class="w-20rem" [(ngModel)]="hotelId" [options]="hotelOptions" optionLabel="label" optionValue="value" placeholder="Selecciona hotel"/>
        <p-datepicker [(ngModel)]="range" selectionMode="range" dateFormat="yy-mm-dd" placeholder="Rango de fechas" />
        <p-button label="Consultar" icon="pi pi-search" (onClick)="load()" />
      </div>
    </ng-template>
  </p-toolbar>

  <div class="grid grid-cols-12 gap-4" *ngIf="data() as d">
    <div class="col-span-12 md:col-span-4">
      <div class="p-4 border rounded-xl">
        <div class="text-sm opacity-70">Habitación más popular</div>
        <div class="text-xl font-semibold mt-1">
          {{ habitLabel(d.top.habitacionId) }}
        </div>
        <div class="mt-3">Alojamientos: <b>{{ d.top.alojamientos }}</b></div>
        <div class="text-xs opacity-60 mt-3">Período: {{ d.desde }} → {{ d.hasta }}</div>
      </div>
    </div>

    <div class="col-span-12 md:col-span-8">
      <div class="p-4 border rounded-xl">
        <div class="font-semibold mb-3">Ranking por alojamientos</div>
        <p-table [value]="d.ranking">
          <ng-template #header>
            <tr><th>Habitación</th><th class="text-right">Alojamientos</th></tr>
          </ng-template>
          <ng-template #body let-r>
            <tr>
              <td>{{ habitLabel(r.habitacionId) }}</td>
              <td class="text-right">{{ r.alojamientos }}</td>
            </tr>
          </ng-template>
        </p-table>
      </div>
    </div>

    <div class="col-span-12">
      <div class="p-4 border rounded-xl">
        <div class="font-semibold mb-3">Reservas del período</div>
        <p-table [value]="d.reservas" [paginator]="true" [rows]="10">
          <ng-template #header>
            <tr>
              <th>Entrada</th><th>Salida</th><th>Habitación</th><th class="text-right">Total</th>
            </tr>
          </ng-template>
          <ng-template #body let-r>
            <tr>
              <td>{{ r.entrada }}</td>
              <td>{{ r.salida }}</td>
              <td>{{ habitLabel(r.habitacionId) }}</td>
              <td class="text-right">{{ r.total | number:'1.2-2' }}</td>
            </tr>
          </ng-template>
        </p-table>
      </div>
    </div>
  </div>

  <p-toast />
  `
})
export class PopularHabitacionComponent implements OnInit {
  private svc = inject(ReportesService);
  private hotelesSvc = inject(HotelesService);
  private habSvc = inject(HabitacionesService); // <-- NUEVO
  private toast = inject(MessageService);

  hotelOptions: {label:string,value:string}[] = [];
  hotelId = '';
  range: Date[] | null = null;
  data = signal<PopularHabitacionResp | null>(null);

  // Cache local de detalles por habitacionId
  habitMap: Record<string, HabitacionDTO> = {};

  ngOnInit(): void {
    this.hotelesSvc.listar().subscribe((hs: HotelDTO[]) => {
      this.hotelOptions = (hs ?? []).map(h => ({label: h.nombre, value: h.id}));
    });
  }

  load(){
    if (!this.hotelId || !this.range || this.range.length < 2) {
      this.toast.add({severity:'warn', summary:'Faltan datos', detail:'Selecciona hotel y rango de fechas.'});
      return;
    }
    const [d,h] = this.normalizeRange(this.range);
    this.svc.popularHabitacion(d!, h!, this.hotelId).subscribe({
      next: resp => {
        this.data.set(resp);
        this.resolveHabitaciones(resp);
      },
      error: _ => this.toast.add({severity:'error', summary:'Error', detail:'No se pudo cargar el reporte'})
    });
  }

  // Recolecta todos los IDs de habitación del reporte y trae sus detalles (con cache)
  private resolveHabitaciones(resp: PopularHabitacionResp) {
    const ids = new Set<string>();
    if (resp?.top?.habitacionId) ids.add(resp.top.habitacionId);
    (resp?.ranking || []).forEach(r => r.habitacionId && ids.add(r.habitacionId));
    (resp?.reservas || []).forEach(r => r.habitacionId && ids.add(r.habitacionId));

    const faltantes = Array.from(ids).filter(id => !this.habitMap[id]);
    if (!faltantes.length) return;

    faltantes.forEach(id => {
      this.habSvc.detalle(id).subscribe({
        next: (det) => { this.habitMap[id] = det; },
        // Si falla, dejamos el id tal cual (fallback a slice)
        error: () => {}
      });
    });
  }

  // Etiqueta bonita: "101 — Doble" o "abcd1234… — Tipo"
  habitLabel(id: string | null | undefined): string {
    if (!id) return '-';
    const h = this.habitMap[id];
    if (!h) return `${id.slice(0,8)}…`;
    const numero = h.numero?.trim();
    const tipo = h.tipo?.trim();
    if (numero && tipo) return `${numero} — ${tipo}`;
    if (numero) return `${numero}`;
    if (tipo) return `${id.slice(0,8)}… — ${tipo}`;
    return `${id.slice(0,8)}…`;
  }

  private normalizeRange(range: Date[]): [string, string] {
    const pad = (n:number)=> n.toString().padStart(2,'0');
    const toYMD = (d:Date)=>`${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
    return [toYMD(range[0]), toYMD(range[1])];
  }
}