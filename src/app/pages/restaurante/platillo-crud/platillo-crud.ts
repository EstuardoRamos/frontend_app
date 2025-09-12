// src/app/pages/platillos/platillos-crud.component.ts
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
import { TextareaModule } from 'primeng/textarea';
import { DialogModule } from 'primeng/dialog';
import { TagModule } from 'primeng/tag';
import { InputIconModule } from 'primeng/inputicon';
import { IconFieldModule } from 'primeng/iconfield';
import { InputNumberModule } from 'primeng/inputnumber';
import { SelectModule } from 'primeng/select';
import { ToggleButtonModule } from 'primeng/togglebutton';

import { MessageService, ConfirmationService } from 'primeng/api';
import { RestaurantesService } from '@/services/restaurante';
import { PlatilloCreateDTO, PlatilloDTO } from '@/interfaces/platillo.model';
import { HotelDTO } from '@/interfaces/hotel.model'; // si lo usas en el mapa de nombres
import { RestauranteDTO } from '@/interfaces/restaurante.model';
import { PlatillosService } from '@/services/platillo-service';

@Component({
    selector: 'app-platillos-crud',
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
        TextareaModule,
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
                    <p-select class="w-20rem" [(ngModel)]="restauranteId" [options]="restaurantesOptions" optionLabel="label" optionValue="value" (onChange)="onRestauranteChange()" />
                    <div class="flex items-center gap-2">
                        <p-toggleButton [(ngModel)]="soloDisponibles" onLabel="Sólo disponibles" offLabel="Todos" (onChange)="applyFilters()" />
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
            currentPageReportTemplate="Mostrando {first} a {last} de {{ filteredRowsAll.length }} platillos"
            (onPage)="onPage($event)"
        >
            <ng-template #header>
                <tr>
                    <th>Imagen</th>
                    <th pSortableColumn="nombre">Nombre <p-sortIcon field="nombre" /></th>
                    <th>Descripción</th>
                    <th>Restaurante</th>
                    <th pSortableColumn="precio">Precio <p-sortIcon field="precio" /></th>
                    <th pSortableColumn="disponible">Disponible <p-sortIcon field="disponible" /></th>
                    <th>Creado</th>
                    <th style="width: 10rem"></th>
                </tr>
            </ng-template>

            <ng-template #body let-p>
                <tr>
                    <td>
                        <img *ngIf="p.imagenUrl" [src]="p.imagenUrl" alt="{{ p.nombre }}" class="rounded" style="width:64px;height:48px;object-fit:cover" />
                    </td>
                    <td class="font-semibold">{{ p.nombre }}</td>
                    <td class="whitespace-pre-line">{{ p.descripcion }}</td>
                    <td>{{ p.restauranteId ? restaurantesMap[p.restauranteId] || p.restauranteId : '—' }}</td>
                    <td>{{ p.precio | number: '1.2-2' }}</td>
                    <td><p-tag [value]="p.disponible ? 'Sí' : 'No'" [severity]="p.disponible ? 'success' : 'danger'" /></td>
                    <td>{{ p.createdAt | date: 'yyyy-MM-dd HH:mm' }}</td>
                    <td class="text-right">
                        <p-button icon="pi pi-pencil" [rounded]="true" [outlined]="true" class="mr-2" (click)="edit(p)" />
                        <p-button icon="pi pi-trash" severity="danger" [rounded]="true" [outlined]="true" (click)="remove(p)" />
                    </td>
                </tr>
            </ng-template>
        </p-table>

        <!-- Diálogo -->
        <p-dialog [(visible)]="dialogVisible" [modal]="true" [style]="{ width: '680px' }" header="Platillo">
            <ng-template #content>
                <div class="grid grid-cols-12 gap-4">
                    <div class="col-span-12 md:col-span-6">
                        <label class="block font-bold mb-2">Restaurante (opcional)</label>
                        <p-select [(ngModel)]="buffer.restauranteId" [options]="restaurantesOptionsSinTodos" optionLabel="label" optionValue="value" placeholder="Sin restaurante" styleClass="w-full" />
                    </div>

                    <div class="col-span-12 md:col-span-6">
                        <label class="block font-bold mb-2">Nombre</label>
                        <input pInputText [(ngModel)]="buffer.nombre" [ngClass]="{ 'p-invalid': submitted && !isNombreValido() }" />
                        <small class="text-red-500" *ngIf="submitted && !isNombreValido()">Mínimo 3 caracteres.</small>
                    </div>

                    <div class="col-span-12">
                        <label class="block font-bold mb-2">Descripción</label>
                        <textarea pTextarea [(ngModel)]="buffer.descripcion" rows="3" [ngClass]="{ 'p-invalid': submitted && !isDescripcionValida() }"></textarea>
                        <small class="text-red-500" *ngIf="submitted && !isDescripcionValida()">Mínimo 5 caracteres.</small>
                    </div>

                    <div class="col-span-6">
                        <label class="block font-bold mb-2">Precio</label>
                        <p-inputNumber [(ngModel)]="buffer.precio" mode="currency" currency="GTQ" locale="es-GT" [min]="0.01" [max]="100000" [useGrouping]="false" [ngClass]="{ 'p-invalid': submitted && !isPrecioValido() }"></p-inputNumber>
                        <small class="text-red-500" *ngIf="submitted && !isPrecioValido()">Debe ser mayor a 0.</small>
                    </div>

                    <div class="col-span-6">
                        <label class="block font-bold mb-2">Imagen (URL)</label>
                        <input pInputText [(ngModel)]="buffer.imagenUrl" placeholder="https://..." [ngClass]="{ 'p-invalid': submitted && !isImagenUrlValida() }" />
                        <small class="text-red-500" *ngIf="submitted && !isImagenUrlValida()">URL inválida.</small>
                    </div>

                    <div class="col-span-12">
                        <label class="block font-bold mb-2">Disponible</label>
                        <p-toggleButton onLabel="Sí" offLabel="No" [(ngModel)]="buffer.disponible"></p-toggleButton>
                    </div>

                    <div class="col-span-12" *ngIf="buffer.imagenUrl">
                        <img [src]="buffer.imagenUrl" alt="preview" class="rounded border" style="max-width: 240px; max-height: 160px; object-fit: cover;" />
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
export class PlatillosCrudComponent implements OnInit {
    @ViewChild('dt') dt!: Table;

    // Select restaurante
    restauranteId: string | 'ALL' = 'ALL';
    restaurantesOptions: { label: string; value: string }[] = [{ label: 'Todos', value: 'ALL' }];
    restaurantesOptionsSinTodos: { label: string; value: string }[] = [];
    restaurantesMap: Record<string, string> = {};

    // Datos
    allRows: PlatilloDTO[] = [];
    filteredRowsAll: PlatilloDTO[] = [];
    rows = signal<PlatilloDTO[]>([]);
    pageIndex = 0;
    pageSize = 10;

    // Filtros
    q = '';
    soloDisponibles = false;

    // Diálogo
    dialogVisible = false;
    submitted = false;
    buffer!: Partial<PlatilloDTO>;

    constructor(
        private svc: PlatillosService,
        private restaurantesSvc: RestaurantesService,
        private toast: MessageService,
        private confirm: ConfirmationService
    ) {}

    ngOnInit(): void {
        // Cargar restaurantes para select
        this.restaurantesSvc.listarTodos().subscribe({
            next: (rs: RestauranteDTO[]) => {
                const arr = rs ?? [];
                this.restaurantesOptions = [{ label: 'Todos', value: 'ALL' }, ...arr.map((r) => ({ label: r.nombre, value: r.id }))];
                this.restaurantesOptionsSinTodos = arr.map((r) => ({ label: r.nombre, value: r.id }));
                this.restaurantesMap = arr.reduce((acc, r) => ((acc[r.id] = r.nombre), acc), {} as Record<string, string>);
            }
        });

        // Cargar base (todos)
        this.loadBase();
    }

    // -------- Carga y filtros ----------
    loadBase() {
        const rid = this.restauranteId === 'ALL' ? null : this.restauranteId;
        this.svc.listarTodos(rid).subscribe({
            next: (arr) => {
                this.allRows = arr ?? [];
                this.applyFilters(true);
            },
            error: (_) => this.toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar platillos' })
        });
    }

    // valor del select: 'ALL' | <uuid>
    onRestauranteChange() {
        this.pageIndex = 0;
        const rid = this.restauranteId === 'ALL' ? null : this.restauranteId;
        this.svc.listarTodos(rid).subscribe({
            next: (arr) => {
                this.allRows = arr ?? [];
                this.applyFilters(true);
            },
            error: (_) => this.toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar platillos' })
        });
    }

    onPage(e: any) {
        this.pageSize = e.rows ?? this.pageSize;
        this.pageIndex = Math.floor((e.first ?? 0) / this.pageSize);
        this.slicePage();
    }

    applyFilters(resetPage = false) {
  if (resetPage) this.pageIndex = 0;

  let list = [...(this.allRows || [])];

  if (this.soloDisponibles) list = list.filter(p => !!p.disponible);

  const q = this.q.trim().toLowerCase();
  if (q) {
    // ← SOLO por nombre del platillo
    list = list.filter(p => (p.nombre || '').toLowerCase().includes(q));
  }

  this.filteredRowsAll = list;
  this.slicePage();
}

    slicePage() {
        const start = this.pageIndex * this.pageSize;
        this.rows.set(this.filteredRowsAll.slice(start, start + this.pageSize));
    }

    // -------- CRUD ----------
    openNew() {
        this.buffer = {
            restauranteId: this.restauranteId === 'ALL' ? null : this.restauranteId,
            nombre: '',
            descripcion: '',
            precio: 0,
            imagenUrl: '',
            disponible: true
        };
        this.submitted = false;
        this.dialogVisible = true;
    }

    edit(p: PlatilloDTO) {
        this.buffer = { ...p }; // el precio ya viene como número
        this.submitted = false;
        this.dialogVisible = true;
    }

    hideDialog() {
        this.dialogVisible = false;
    }

    // Validaciones
    private s(v: any) {
        return (v ?? '').toString().trim();
    }
    isNombreValido() {
        return this.s(this.buffer?.nombre).length >= 3;
    }
    isDescripcionValida() {
        return this.s(this.buffer?.descripcion).length >= 5;
    }
    isPrecioValido() {
        const n = Number(this.buffer?.precio);
        return !isNaN(n) && n > 0;
    }
    isImagenUrlValida() {
        const u = this.s(this.buffer?.imagenUrl);
        if (!u) return true; // opcional
        try {
            new URL(u);
            return true;
        } catch {
            return false;
        }
    }
    formValid() {
        return this.isNombreValido() && this.isDescripcionValida() && this.isPrecioValido() && this.isImagenUrlValida();
    }

    save() {
        this.submitted = true;
        if (!this.formValid()) {
            this.toast.add({ severity: 'warn', summary: 'Validación', detail: 'Revisa los campos obligatorios.' });
            return;
        }

        const nombre = this.s(this.buffer.nombre);
        const descripcion = this.s(this.buffer.descripcion);
        const imagenUrl = this.s(this.buffer.imagenUrl);

        if (this.buffer.id) {
            const id = this.buffer.id;
            const patch: Partial<PlatilloCreateDTO> = {
                restauranteId: (this.buffer.restauranteId ?? null) as string | null,
                nombre,
                descripcion,
                precio: Number(this.buffer.precio),
                imagenUrl: imagenUrl || null,
                disponible: !!this.buffer.disponible
            };
            this.svc.actualizar(id, patch).subscribe({
                next: (updated) => {
                    const idx = this.allRows.findIndex((x) => x.id === id);
                    if (idx >= 0) this.allRows[idx] = updated;
                    this.applyFilters();
                    this.dialogVisible = false;
                    this.toast.add({ severity: 'success', summary: 'Actualizado' });
                },
                error: (_) => this.toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudo actualizar' })
            });
        } else {
            const dto: PlatilloCreateDTO = {
                restauranteId: (this.buffer.restauranteId ?? null) as string | null,
                nombre,
                descripcion,
                precio: Number(this.buffer.precio),
                imagenUrl: imagenUrl || null,
                disponible: !!this.buffer.disponible
            };
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

    remove(p: PlatilloDTO) {
        this.confirm.confirm({
            message: `¿Deshabilitar platillo «${p.nombre}»?`,
            header: 'Confirmar',
            icon: 'pi pi-exclamation-triangle',
            acceptLabel: 'Sí, deshabilitar',
            accept: () => {
                this.svc.deshabilitar(p.id).subscribe({
                    next: (_) => {
                        const idx = this.allRows.findIndex((x) => x.id === p.id);
                        if (idx >= 0) this.allRows[idx] = { ...this.allRows[idx], enabled: false, disponible: false };
                        this.applyFilters();
                        this.toast.add({ severity: 'success', summary: 'Deshabilitado' });
                    },
                    error: (_) => this.toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudo deshabilitar' })
                });
            }
        });
    }

    // Exportar CSV
    exportCSV() {
        const data = this.filteredRowsAll || [];
        if (!data.length) {
            this.toast.add({ severity: 'info', summary: 'Exportar', detail: 'No hay datos para exportar' });
            return;
        }
        const headers = ['Nombre', 'Descripción', 'Restaurante', 'Precio', 'Disponible', 'Imagen'];
        const lines = data.map((p) => [
            this.csvSafe(p.nombre),
            this.csvSafe(p.descripcion || ''),
            this.csvSafe(p.restauranteId ? this.restaurantesMap[p.restauranteId] || p.restauranteId : ''),
            (p.precio ?? 0).toString(),
            p.disponible ? 'Sí' : 'No',
            this.csvSafe(p.imagenUrl || '')
        ]);
        const csv = [headers.join(','), ...lines.map((l) => l.join(','))].join('\n');
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'platillos.csv';
        a.click();
        URL.revokeObjectURL(url);
    }

    private csvSafe(v: string) {
        const needs = /[",\n]/.test(v);
        const esc = v.replace(/"/g, '""');
        return needs ? `"${esc}"` : esc;
    }
}
