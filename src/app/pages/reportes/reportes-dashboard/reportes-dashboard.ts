// src/app/pages/reportes/reportes-dashboard.component.ts
import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ToolbarModule } from 'primeng/toolbar';
import { SelectModule } from 'primeng/select';
import { DatePickerModule } from 'primeng/datepicker';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';

import { ReportesService } from '@/services/reportes.service';
import { RestaurantesService } from '@/services/restaurante';
import { HotelesService } from '@/services/hotel';
import { RestauranteDTO } from '@/interfaces/restaurante.model';
import { HotelDTO } from '@/interfaces/hotel.model';
import { PopularRestauranteReport, PopularHabitacionReport, IngresosRestauranteReport } from '@/interfaces/reportes.model';

@Component({
  selector: 'app-reportes-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, ToolbarModule, SelectModule, DatePickerModule, ButtonModule, TableModule, TagModule, ToastModule],
  providers: [MessageService],
  template: `
  <p-toolbar styleClass="mb-4">
    <ng-template #start>
      <div class="flex flex-wrap items-end gap-3">
        <div>
          <label class="block font-semibold mb-1">Restaurante</label>
          <p-select class="w-18rem" [(ngModel)]="restauranteId" [options]="restOptions" optionLabel="label" optionValue="value" />
        </div>
        <div>
          <label class="block font-semibold mb-1">Hotel</label>
          <p-select class="w-18rem" [(ngModel)]="hotelId" [options]="hotelOptions" optionLabel="label" optionValue="value" />
        </div>
        <div>
          <label class="block font-semibold mb-1">Rango (popular)</label>
          <p-datepicker [(ngModel)]="rangePop" selectionMode="range" dateFormat="yy-mm-dd" placeholder="YYYY-MM-DD a YYYY-MM-DD" />
        </div>
        <div>
          <label class="block font-semibold mb-1">Rango (ingresos)</label>
          <p-datepicker [(ngModel)]="rangeIng" selectionMode="range" dateFormat="yy-mm-dd" placeholder="YYYY-MM-DD a YYYY-MM-DD" />
        </div>
        <p-button label="Aplicar" icon="pi pi-refresh" (onClick)="loadAll()" />
      </div>
    </ng-template>
  </p-toolbar>

  <!-- KPIs / Top -->
  <div class="grid grid-cols-12 gap-4 mb-4">
    <div class="col-span-12 lg:col-span-6">
      <div class="card p-4">
        <div class="font-bold mb-3">Restaurante más popular</div>
        <div *ngIf="popRest()?.top; else noPopRest">
          <div class="flex justify-between items-center">
            <div>
              <div class="text-sm opacity-70">Restaurante</div>
              <div class="text-xl font-semibold">{{ nombreRest(popRest()!.top!.restauranteId) }}</div>
            </div>
            <div class="text-right">
              <div class="text-sm opacity-70">Ingresos</div>
              <div class="text-2xl font-bold">{{ popRest()!.top!.ingresos | number:'1.2-2' }}</div>
              <div class="text-sm opacity-70">Facturas: {{ popRest()!.top!.facturas }}</div>
            </div>
          </div>
        </div>
        <ng-template #noPopRest><div class="opacity-70">Sin datos.</div></ng-template>

        <p-table class="mt-3" [value]="popRest()?.ranking || []" [rows]="5" [paginator]="true">
          <ng-template #header>
            <tr><th>Restaurante</th><th class="text-right">Ingresos</th></tr>
          </ng-template>
          <ng-template #body let-r>
            <tr>
              <td>{{ nombreRest(r.restauranteId) }}</td>
              <td class="text-right">{{ r.ingresos | number:'1.2-2' }}</td>
            </tr>
          </ng-template>
        </p-table>

        <div class="font-semibold mt-3">Facturas</div>
        <p-table [value]="popRest()?.facturas || []" [rows]="5" [paginator]="true">
          <ng-template #header>
            <tr><th>Fecha</th><th class="text-right">Subtotal</th><th class="text-right">Total</th><th>Estado</th></tr>
          </ng-template>
          <ng-template #body let-f>
            <tr>
              <td>{{ f.createdAt | date:'short' }}</td>
              <td class="text-right">{{ f.subtotal | number:'1.2-2' }}</td>
              <td class="text-right">{{ f.total | number:'1.2-2' }}</td>
              <td><p-tag [value]="f.estado" [severity]="f.estado==='EMITIDA' ? 'success':'danger'"></p-tag></td>
            </tr>
          </ng-template>
        </p-table>
      </div>
    </div>

    <div class="col-span-12 lg:col-span-6">
      <div class="card p-4">
        <div class="font-bold mb-3">Habitación más popular</div>
        <div *ngIf="popHab()?.top; else noPopHab">
          <div class="flex justify-between items-center">
            <div>
              <div class="text-sm opacity-70">Hotel</div>
              <div class="text-xl font-semibold">{{ nombreHotel(popHab()!.top!.hotelId) }}</div>
              <div class="text-sm opacity-70 mt-1">Habitación</div>
              <div class="font-medium">{{ popHab()!.top!.habitacionId | slice:0:8 }}...</div>
            </div>
            <div class="text-right">
              <div class="text-sm opacity-70">Alojamientos</div>
              <div class="text-2xl font-bold">{{ popHab()!.top!.alojamientos }}</div>
            </div>
          </div>
        </div>
        <ng-template #noPopHab><div class="opacity-70">Sin datos.</div></ng-template>

        <p-table class="mt-3" [value]="popHab()?.ranking || []" [rows]="5" [paginator]="true">
          <ng-template #header>
            <tr><th>Habitación</th><th class="text-right">Alojamientos</th></tr>
          </ng-template>
          <ng-template #body let-r>
            <tr>
              <td>{{ r.habitacionId | slice:0:8 }}...</td>
              <td class="text-right">{{ r.alojamientos }}</td>
            </tr>
          </ng-template>
        </p-table>

        <div class="font-semibold mt-3">Reservas</div>
        <p-table [value]="popHab()?.reservas || []" [rows]="5" [paginator]="true">
          <ng-template #header>
            <tr><th>Entrada</th><th>Salida</th><th>Huéspedes</th><th class="text-right">Total</th></tr>
          </ng-template>
          <ng-template #body let-rv>
            <tr>
              <td>{{ rv.entrada }}</td>
              <td>{{ rv.salida }}</td>
              <td>{{ rv.huespedes }}</td>
              <td class="text-right">{{ rv.total | number:'1.2-2' }}</td>
            </tr>
          </ng-template>
        </p-table>
      </div>
    </div>
  </div>

  <!-- Ingresos por restaurante -->
  <div class="card p-4">
    <div class="flex items-center justify-between mb-3">
      <div class="font-bold">Ingresos por restaurante</div>
      <div class="text-lg">Total: <b>{{ ingresos()?.total | number:'1.2-2' }}</b></div>
    </div>
    <p-table [value]="ingresos()?.facturas || []" [rows]="10" [paginator]="true">
      <ng-template #header>
        <tr><th>Fecha</th><th class="text-right">Subtotal</th><th class="text-right">Impuesto</th><th class="text-right">Propina</th><th class="text-right">Total</th><th>Estado</th></tr>
      </ng-template>
      <ng-template #body let-f>
        <tr>
          <td>{{ f.createdAt | date:'short' }}</td>
          <td class="text-right">{{ f.subtotal | number:'1.2-2' }}</td>
          <td class="text-right">{{ f.impuesto | number:'1.2-2' }}</td>
          <td class="text-right">{{ f.propina | number:'1.2-2' }}</td>
          <td class="text-right">{{ f.total | number:'1.2-2' }}</td>
          <td><p-tag [value]="f.estado" [severity]="f.estado==='EMITIDA' ? 'success':'danger'"></p-tag></td>
        </tr>
      </ng-template>
    </p-table>
  </div>

  <p-toast />
  `
})
export class ReportesDashboardComponent implements OnInit {
  private toast = inject(MessageService);
  private rep = inject(ReportesService);
  private restSvc = inject(RestaurantesService);
  private hotelSvc = inject(HotelesService);

  restOptions: {label:string, value:string}[] = [];
  hotelOptions: {label:string, value:string}[] = [];
  restauranteId = ''; hotelId = '';

  rangePop: Date[] | null = null;
  rangeIng: Date[] | null = null;

  popRest = signal<PopularRestauranteReport | null>(null);
  popHab  = signal<PopularHabitacionReport | null>(null);
  ingresos = signal<IngresosRestauranteReport | null>(null);

  restaurantesMap: Record<string,string> = {};
  hotelesMap: Record<string,string> = {};

  ngOnInit(): void {
    this.restSvc.listarTodos().subscribe({
      next: (arr: RestauranteDTO[]) => {
        this.restOptions = (arr ?? []).map(r => ({label: r.nombre, value: r.id}));
        this.restaurantesMap = (arr ?? []).reduce((a, r) => (a[r.id]=r.nombre, a), {} as Record<string,string>);
        this.restauranteId = this.restOptions[0]?.value || '';
      }
    });
    this.hotelSvc.listar().subscribe({
      next: (arr: HotelDTO[]) => {
        this.hotelOptions = (arr ?? []).map(h => ({label: h.nombre, value: h.id}));
        this.hotelesMap = (arr ?? []).reduce((a, h) => (a[h.id]=h.nombre, a), {} as Record<string,string>);
        this.hotelId = this.hotelOptions[0]?.value || '';
      }
    });
  }

  loadAll() {
    const [d1,h1] = this.asRange(this.rangePop);
    const [d2,h2] = this.asRange(this.rangeIng);

    // Popular restaurante
    this.rep.popularRestaurante(d1,h1,this.restauranteId || undefined).subscribe({
      next: r => this.popRest.set(r),
      error: _ => this.toast.add({severity:'error', summary:'Error', detail:'No se pudo cargar “Restaurante popular”.'})
    });

    // Popular habitación (requiere hotelId y rango)
    if (this.hotelId && d1 && h1) {
      this.rep.popularHabitacion(d1,h1,this.hotelId).subscribe({
        next: r => this.popHab.set(r),
        error: _ => this.toast.add({severity:'error', summary:'Error', detail:'No se pudo cargar “Habitación popular”.'})
      });
    } else {
      this.popHab.set(null);
    }

    // Ingresos por restaurante
    if (this.restauranteId) {
      this.rep.ingresosRestaurante(this.restauranteId, d2, h2).subscribe({
        next: r => this.ingresos.set(r),
        error: _ => this.toast.add({severity:'error', summary:'Error', detail:'No se pudo cargar “Ingresos”.'})
      });
    } else {
      this.ingresos.set(null);
    }
  }

  nombreRest(id: string)  { return this.restaurantesMap[id] || (id?.slice(0,8)+'...'); }
  nombreHotel(id: string) { return this.hotelesMap[id] || (id?.slice(0,8)+'...'); }

  private asRange(range: Date[] | null): [string|undefined,string|undefined] {
    if (!range || range.length < 2) return [undefined, undefined];
    const pad = (n:number)=> n.toString().padStart(2,'0');
    const toYMD = (d:Date)=>`${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
    return [toYMD(range[0]), toYMD(range[1])];
  }
}