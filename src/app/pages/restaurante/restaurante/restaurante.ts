import { Component, OnInit, ViewChild, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { Table, TableModule } from 'primeng/table';
import { ToolbarModule } from 'primeng/toolbar';
import { ButtonModule } from 'primeng/button';
import { RippleModule } from 'primeng/ripple';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { InputTextModule } from 'primeng/inputtext';
import { DialogModule } from 'primeng/dialog';
import { TagModule } from 'primeng/tag';
import { InputIconModule } from 'primeng/inputicon';
import { IconFieldModule } from 'primeng/iconfield';
import { InputNumberModule } from 'primeng/inputnumber';
import { SelectModule } from 'primeng/select';
import { ToggleButtonModule } from 'primeng/togglebutton';
//import { InputSwitchModule } from 'primeng/inputswitch';

import { MessageService, ConfirmationService } from 'primeng/api';
import { RestauranteCreateDTO, RestauranteDTO } from '@/interfaces/restaurante.model';
import { RestaurantesService } from '@/services/restaurante';
import { HotelesService } from '@/services/hotel';
import { HotelDTO } from '@/interfaces/hotel.model';

@Component({
    selector: 'app-restaurantes-crud',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        TableModule,
        ToolbarModule,
        ButtonModule,
        RippleModule,
        ToastModule,
        ConfirmDialogModule,
        InputTextModule,
        DialogModule,
        TagModule,
        InputIconModule,
        IconFieldModule,
        InputNumberModule,
        SelectModule,
        ToggleButtonModule
    ],
    template: `
        <p-toolbar styleClass="mb-4">
            <ng-template #start>
                <div class="flex flex-wrap gap-3 items-end">
                    <p-select class="w-20rem" [(ngModel)]="hotelId" [options]="hotelesOptions" optionLabel="label" optionValue="value" (onChange)="onHotelChange()" />
                    <div class="flex items-center gap-2">
                        <p-toggleButton [(ngModel)]="soloActivos" onLabel="Solo activos" offLabel="Todos" (onChange)="applyFilters()" />
                        <label class="text-sm">Solo activos</label>
                    </div>
                    <p-button label="Nuevo" icon="pi pi-plus" (onClick)="openNew()" />
                    <p-button label="Exportar CSV" icon="pi pi-upload" severity="secondary" (onClick)="exportCSV()" />
                </div>
            </ng-template>
            <ng-template #end>
                <p-iconfield>
                    <p-inputicon styleClass="pi pi-search" />
                    <input pInputText type="text" [(ngModel)]="q" (input)="applyFilters()" placeholder="Buscar..." />
                </p-iconfield>
            </ng-template>
        </p-toolbar>

        <p-table
            #dt
            [value]="rows()"
            [paginator]="true"
            [rows]="pageSize"
            [rowsPerPageOptions]="[10, 20, 30]"
            dataKey="id"
            [rowHover]="true"
            [showCurrentPageReport]="true"
            currentPageReportTemplate="Mostrando {first} a {last} de {{ filteredRowsAll.length }} restaurantes"
            (onPage)="onPage($event)"
        >
            <ng-template #header>
                <tr>
                    <th pSortableColumn="nombre">Nombre <p-sortIcon field="nombre" /></th>
                    <th>Dirección</th>
                    <th>Hotel</th>
                    <th pSortableColumn="impuestoPorc">% Impuesto <p-sortIcon field="impuestoPorc" /></th>
                    <th pSortableColumn="propinaPorcDefault">% Propina <p-sortIcon field="propinaPorcDefault" /></th>
                    <th pSortableColumn="enabled">Activo <p-sortIcon field="enabled" /></th>
                    <th style="width: 10rem"></th>
                </tr>
            </ng-template>

            <ng-template #body let-r>
                <tr>
                    <td class="font-semibold">{{ r.nombre }}</td>
                    <td>{{ r.direccion }}</td>
                    <td>{{ r.hotelId ? hotelesMap[r.hotelId] || r.hotelId : 'Sin hotel' }}</td>
                    <td>{{ r.impuestoPorc *100| number: '1.2-2' }}%</td>
                    <td>{{ r.propinaPorcDefault*100 | number: '1.2-2' }}%</td>
                    <td><p-tag [value]="r.enabled ? 'Sí' : 'No'" [severity]="r.enabled ? 'success' : 'danger'"></p-tag></td>
                    <td class="text-right">
  <ng-container *ngIf="r.enabled; else disabledRow">
    <p-button icon="pi pi-pencil" [rounded]="true" [outlined]="true"
              class="mr-2" (click)="edit(r)" />
    <p-button icon="pi pi-ban" label="Deshabilitar" severity="danger"
              [rounded]="true" [outlined]="true" (click)="remove(r)" />
  </ng-container>

  <ng-template #disabledRow>
    <p-button icon="pi pi-check-circle" label="Habilitar" severity="success"
              [rounded]="true" [outlined]="true" (click)="enable(r)" />
  </ng-template>
</td>
                </tr>
            </ng-template>
        </p-table>

        <!-- Diálogo -->
        <p-dialog [(visible)]="dialogVisible" [modal]="true" [style]="{ width: '620px' }" header="Restaurante">
            <ng-template #content>
                <div class="grid grid-cols-12 gap-4">
                    <div class="col-span-12 md:col-span-6">
                        <label class="block font-bold mb-2">Hotel (opcional)</label>
                        <p-select [(ngModel)]="buffer.hotelId" [options]="hotelesOptionsSinTodos" optionLabel="label" optionValue="value" placeholder="Sin hotel" styleClass="w-full" />
                    </div>
                    <div class="col-span-12 md:col-span-6">
                        <label class="block font-bold mb-2">Nombre</label>
                        <input pInputText [(ngModel)]="buffer.nombre" />
                        <small class="text-red-500" *ngIf="submitted && !isNombreValido()">Mínimo 3 caracteres.</small>
                    </div>

                    <div class="col-span-12">
                        <label class="block font-bold mb-2">Dirección</label>
                        <input pInputText [(ngModel)]="buffer.direccion" />
                    </div>

                    <div class="col-span-6">
                        <label class="block font-bold mb-2">% Impuesto</label>
                        <p-inputNumber [(ngModel)]="buffer.impuestoPorc" mode="decimal" [min]="0" [max]="100" [minFractionDigits]="0" [maxFractionDigits]="2"></p-inputNumber>
                        <small class="text-red-500" *ngIf="submitted && !isPorcentaje(buffer.impuestoPorc)">0 a 100.</small>
                    </div>
                    <div class="col-span-6">
                        <label class="block font-bold mb-2">% Propina por defecto</label>
                        <p-inputNumber [(ngModel)]="buffer.propinaPorcDefault" mode="decimal" [min]="0" [max]="100" [minFractionDigits]="0" [maxFractionDigits]="2"></p-inputNumber>
                        <small class="text-red-500" *ngIf="submitted && !isPorcentaje(buffer.propinaPorcDefault)">0 a 100.</small>
                    </div>

                    <div class="col-span-12" *ngIf="buffer.id">
                        <label class="block font-bold mb-2">Activo</label>
                        <p-toggleButton onLabel="Sí" offLabel="No" [(ngModel)]="buffer.enabled"></p-toggleButton>
                    </div>
                </div>
            </ng-template>
            <ng-template #footer>
              <p-button label="Cancelar" icon="pi pi-times" text (click)="hideDialog()" />
              <p-button label="Guardar" icon="pi pi-check" (click)="save()" [disabled]="!formValid()" />
            </ng-template>
        </p-dialog>

        <p-confirmDialog />
        <p-toast />
    `,
    providers: [MessageService, ConfirmationService]
})
export class RestaurantesCrudComponent implements OnInit {
    @ViewChild('dt') dt!: Table;

    // Select de hotel
    hotelId: string | null = 'ALL'; // 'ALL' | 'NO_HOTEL' | <uuid>
    hotelesOptions: { label: string; value: string }[] = [
        { label: 'Todos', value: 'ALL' },
        { label: 'Sin hotel', value: 'NO_HOTEL' }
    ];
    hotelesOptionsSinTodos: { label: string; value: string }[] = []; // para diálogo

    // Datos
    allRows: RestauranteDTO[] = []; // lo que viene del backend
    filteredRowsAll: RestauranteDTO[] = []; // resultado de filtros
    rows = signal<RestauranteDTO[]>([]); // página mostrada
    pageIndex = 0;
    pageSize = 10;

    // ...propiedades...
    hotelesMap: Record<string, string> = {};

    // Filtros
    q = '';
    soloActivos = false;

    // Diálogo
    dialogVisible = false;
    submitted = false;
    buffer!: Partial<RestauranteDTO>;

    constructor(
        private svc: RestaurantesService,
        private hotelesSvc: HotelesService,
        private toast: MessageService,
        private confirm: ConfirmationService
    ) {}

    ngOnInit(): void {
        // cargar hoteles para el select
        this.hotelesSvc.listar().subscribe({
            next: (hs: HotelDTO[]) => {
                const hoteles = hs.map((h) => ({ label: h.nombre, value: h.id }));
                // Mapa id → nombre
                this.hotelesMap = hs.reduce(
                    (acc, h) => {
                        acc[h.id] = h.nombre;
                        return acc;
                    },
                    {} as Record<string, string>
                );

                this.hotelesOptions = [{ label: 'Todos', value: 'ALL' }, { label: 'Sin hotel', value: 'NO_HOTEL' }, ...hoteles];
                this.hotelesOptionsSinTodos = hoteles;
            }
        });

        // carga inicial: todos
        this.loadBase();
    }

    // ----- Carga y filtros -----
    loadBase() {
        // Si seleccionaste un hotel específico, usa listarPorHotel; si no, trae todos.
        if (this.hotelId && this.hotelId !== 'ALL' && this.hotelId !== 'NO_HOTEL') {
            this.svc.listarPorHotel(this.hotelId).subscribe({
                next: (arr) => {
                    this.allRows = arr ?? [];
                    this.applyFilters(true);
                },
                error: (_) => this.toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar restaurantes' })
            });
            console.log('restaurantes por hotel');
            console.log(this.allRows);
        } else {
            this.svc.listarTodos().subscribe({
                next: (arr) => {
                    this.allRows = arr ?? [];
                    this.applyFilters(true);
                },

                error: (_) => this.toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar restaurantes' })
            });
            console.log('restaurantes todos');
            console.log(this.allRows);
        }
    }

    onPage(e: any) {
        this.pageSize = e.rows ?? this.pageSize;
        this.pageIndex = Math.floor((e.first ?? 0) / this.pageSize);
        this.slicePage();
    }

    applyFilters(resetPage = false) {
        if (resetPage) this.pageIndex = 0;

        let list = [...(this.allRows || [])];

        // “Sin hotel”
        if (this.hotelId === 'NO_HOTEL') {
            list = list.filter((r) => !r.hotelId || r.hotelId === '');
        }

        // Hotel específico: ya viene filtrado desde el server (pero si el server ignora hotelId, lo reforzamos)
        if (this.hotelId && this.hotelId !== 'ALL' && this.hotelId !== 'NO_HOTEL') {
            list = list.filter((r) => r.hotelId === this.hotelId);
            console.log('Aqui');    
        }

        // Solo activos
        if (this.soloActivos) list = list.filter((r) => !!r.enabled);

        // Texto
        const q = this.q.trim().toLowerCase();
        if (q) {
            list = list.filter((r) => r.nombre.toLowerCase().includes(q) || (r.direccion || '').toLowerCase().includes(q));
        }

        this.filteredRowsAll = list;
        this.slicePage();
    }

    slicePage() {
        const start = this.pageIndex * this.pageSize;
        this.rows.set(this.filteredRowsAll.slice(start, start + this.pageSize));
    }

    // cuando cambie el select de hotel
    applyFiltersFromHotel() {
        this.pageIndex = 0;
        this.loadBase(); // recarga base (por si usas listarPorHotel)
    }

    // Usado por (onChange) del select
    applyFiltersOrReload() {
        if (this.hotelId === 'ALL' || this.hotelId === 'NO_HOTEL') {
            // seguimos con la base general
            this.applyFilters(true);
        } else {
            // hotel específico → recarga base por hotel
            this.loadBase();
        }
    }

    // Alias para el template (más claro)
    onHotelChange() {
        this.pageIndex = 0;
        if (this.hotelId === 'ALL' || this.hotelId === 'NO_HOTEL') {
            // seguimos usando la base ya cargada (todos) y filtramos en cliente
            this.applyFilters(true);
        } else {
            // hotel específico → pide al backend por ese hotel y luego filtra
            this.loadBase();
        }
    }

    // ----- CRUD -----
    openNew() {
        this.buffer = {
            hotelId: '',
            nombre: '',
            direccion: '',
            impuestoPorc: 12,
            propinaPorcDefault: 10,
            enabled: true
        } ;
        this.submitted = false;
        this.dialogVisible = true;
    }

    edit(r: RestauranteDTO) {
        this.buffer = { ...r };
        this.submitted = false;
        this.dialogVisible = true;
    }

    hideDialog() {
        this.dialogVisible = false;
    }

    isNombreValido() {
        return (this.buffer?.nombre || '').trim().length >= 3;
    }
    isPorcentaje(v: any) {
        const n = Number(v);
        return !isNaN(n) && n >= 0 && n <= 100;
    }

    save() {
        this.submitted = true;

        if (!this.isNombreValido() || !this.isPorcentaje(this.buffer.impuestoPorc) || !this.isPorcentaje(this.buffer.propinaPorcDefault)) {
            this.toast.add({ severity: 'warn', summary: 'Validación', detail: 'Revisa los campos obligatorios.' });
            return;
        }

        if (this.buffer.id) {
            const id = this.buffer.id;
            this.svc.actualizar(id, this.buffer).subscribe({
                next: (updated) => {
                    // Refresca en memoria
                    console.log('Actualizar');
            
                    console.log(this.buffer);
                    const idx = this.allRows.findIndex((x) => x.id === id);
                    if (idx >= 0) this.allRows[idx] = updated;
                    this.applyFilters();
                    this.dialogVisible = false;
                    this.toast.add({ severity: 'success', summary: 'Actualizado' });
                },
                error: (_) => this.toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudo actualizar' })
            });
        } else {
            const dto: RestauranteCreateDTO = {
                hotelId: this.buffer.hotelId || undefined,
                nombre: this.buffer.nombre!.trim(),
                direccion: this.buffer.direccion || '',
                impuestoPorc: Number(this.buffer.impuestoPorc)/100,
                propinaPorcDefault: Number(this.buffer.propinaPorcDefault)/100
            };
            console.log('crear');
            
            console.log(dto);
            
            this.svc.crear(dto).subscribe({
                next: (created) => {
                    this.allRows.unshift(created);
                    this.applyFilters(true);
                    this.dialogVisible = false;
                    this.toast.add({ severity: 'success', summary: 'Creado' });
                },
                error: (_) => this.toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudo crear' })
            });
        }
    }

    remove(r: RestauranteDTO) {
        this.confirm.confirm({
            message: `¿Deshabilitar restaurante «${r.nombre}»?`,
            header: 'Confirmar',
            icon: 'pi pi-exclamation-triangle',
            acceptLabel: 'Sí, deshabilitar',
            accept: () => {
                this.svc.deshabilitar(r.id).subscribe({
                    next: (_) => {
                        // Marca como inactivo localmente (o recarga todo si prefieres)
                        const idx = this.allRows.findIndex((x) => x.id === r.id);
                        if (idx >= 0) this.allRows[idx] = { ...this.allRows[idx], enabled: false };
                        this.applyFilters();
                        this.toast.add({ severity: 'success', summary: 'Deshabilitado' });
                    },
                    error: (_) => this.toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudo deshabilitar' })
                });
            }
        });
    }

    // ----- Export CSV -----
    exportCSV() {
        const data = this.filteredRowsAll || [];
        if (!data.length) {
            this.toast.add({ severity: 'info', summary: 'Exportar', detail: 'No hay datos para exportar' });
            return;
        }
        const headers = ['Nombre', 'Dirección', '% Impuesto', '% Propina', 'Activo', 'HotelId'];
        const lines = data.map((r) => [this.csvSafe(r.nombre), this.csvSafe(r.direccion || ''), (r.impuestoPorc ?? 0).toString(), (r.propinaPorcDefault ?? 0).toString(), r.enabled ? 'Sí' : 'No', this.csvSafe(r.hotelId || '')]);
        const csv = [headers.join(','), ...lines.map((l) => l.join(','))].join('\n');
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'restaurantes.csv';
        a.click();
        URL.revokeObjectURL(url);
    }

    private csvSafe(v: string) {
        const needs = /[",\n]/.test(v);
        const esc = v.replace(/"/g, '""');
        return needs ? `"${esc}"` : esc;
    }

    enable(r: RestauranteDTO) {
  this.confirm.confirm({
    message: `¿Habilitar restaurante «${r.nombre}»?`,
    header: 'Confirmar',
    icon: 'pi pi-exclamation-triangle',
    acceptLabel: 'Sí, habilitar',
    accept: () => {
      this.svc.habilitar(r.id).subscribe({
        next: _ => {
          // Refresca en memoria
          const idx = this.allRows.findIndex(x => x.id === r.id);
          if (idx >= 0) this.allRows[idx] = { ...this.allRows[idx], enabled: true };
          this.applyFilters();
          this.toast.add({ severity: 'success', summary: 'Habilitado' });
        },
        error: _ => this.toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudo habilitar' })
      });
    }
  });
}

// Trimea string de forma segura
private s(v: any): string { return (v ?? '').toString().trim(); }

isDireccionValida(): boolean {
  return this.s(this.buffer?.direccion).length >= 5;
}


// Corrige valores fuera de rango o NaN
clampPercent(v: any): number {
  let n = Number(v);
  if (isNaN(n)) n = 0;
  if (n < 0) n = 0;
  if (n > 100) n = 100;
  // 2 decimales máximo
  return Math.round(n * 100) / 100;
}

// Validación general del form (para deshabilitar Guardar)
formValid(): boolean {
  return this.isNombreValido()
      && this.isDireccionValida()
      && this.isPorcentaje(this.buffer?.impuestoPorc)
      && this.isPorcentaje(this.buffer?.propinaPorcDefault);
}
}
