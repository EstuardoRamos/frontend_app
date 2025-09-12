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
import { InputIconModule } from 'primeng/inputicon';
import { IconFieldModule } from 'primeng/iconfield';
import { DialogModule } from 'primeng/dialog';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputMaskModule } from 'primeng/inputmask';
//import { DropdownModule } from 'primeng/dropdown';
import { SelectModule } from 'primeng/select';
import { ToggleButtonModule } from 'primeng/togglebutton';
import { TagModule } from 'primeng/tag';

import { MessageService, ConfirmationService } from 'primeng/api';
import { HotelCreateDTO, HotelDTO } from '@/interfaces/hotel.model';
import { HotelesService } from '@/services/hotel';


interface Column { field: string; header: string; customExportHeader?: string; }
interface ExportColumn { title: string; dataKey: string; }

const HH_MM = /^([01]\d|2[0-3]):([0-5]\d)$/;

@Component({
  selector: 'app-hoteles-crud',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    TableModule, ToolbarModule, ButtonModule, RippleModule, ToastModule,
    ConfirmDialogModule, InputTextModule, InputIconModule, IconFieldModule,
    DialogModule, InputNumberModule, InputMaskModule, SelectModule,
    ToggleButtonModule, TagModule
  ],
  template: `
    <p-toolbar styleClass="mb-6">
      <ng-template #start>
        <p-button label="Nuevo" icon="pi pi-plus" severity="secondary" class="mr-2" (onClick)="openNew()" />
        <p-button severity="secondary" label="Eliminar" icon="pi pi-trash" outlined
                  (onClick)="deleteSelected()"
                  [disabled]="!selectedRows || !selectedRows.length" />
      </ng-template>
      <ng-template #end>
        <p-button label="Export CSV" icon="pi pi-upload" severity="secondary" (onClick)="exportCSV()" />
      </ng-template>
    </p-toolbar>

    <p-table #dt
      [value]="rows()"
      [rows]="10"
      [columns]="cols"
      [paginator]="true"
      [globalFilterFields]="['nombre','ciudad','pais','linea1','codigoPostal']"
      [tableStyle]="{ 'min-width': '75rem' }"
      [(selection)]="selectedRows"
      [rowHover]="true"
      dataKey="id"
      currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords} hoteles"
      [showCurrentPageReport]="true"
      [rowsPerPageOptions]="[10,20,30]">

      <ng-template #caption>
        <div class="flex items-center justify-between">
          <h5 class="m-0">Gestionar Hoteles</h5>
          <p-iconfield>
            <p-inputicon styleClass="pi pi-search" />
            <input pInputText type="text" (input)="onGlobalFilter(dt, $event)" placeholder="Buscar..." />
          </p-iconfield>
        </div>
      </ng-template>

      <ng-template #header>
        <tr>
          <th style="width:3rem"><p-tableHeaderCheckbox /></th>
          <th pSortableColumn="nombre" style="min-width: 16rem">
            Nombre <p-sortIcon field="nombre" />
          </th>
          <th pSortableColumn="estrellas" style="min-width:8rem">
            Estrellas <p-sortIcon field="estrellas" />
          </th>
          <th style="min-width:18rem">Ubicación</th>
          <th style="min-width:20rem">Dirección</th>
          <th style="min-width:12rem">Check in/out</th>
          <th pSortableColumn="activo" style="min-width:10rem">
            Activo <p-sortIcon field="activo" />
          </th>
          <th style="min-width: 12rem"></th>
        </tr>
      </ng-template>

      <ng-template #body let-hotel>
        <tr>
          <td style="width:3rem"><p-tableCheckbox [value]="hotel" /></td>
          <td class="font-semibold">{{ hotel.nombre }}</td>
          <td>{{ hotel.estrellas }}</td>
          <td>{{ hotel.ciudad }}, {{ hotel.pais }}</td>
          <td>
            {{ hotel.linea1 }}<ng-container *ngIf="hotel.linea2">, {{ hotel.linea2 }}</ng-container>
            <br /><small *ngIf="hotel.codigoPostal">CP: {{ hotel.codigoPostal }}</small>
          </td>
          <td>{{ hotel.checkInDesde }} – {{ hotel.checkOutHasta }}</td>
          <td>
            <p-tag [value]="hotel.activo ? 'Sí' : 'No'"
                   [severity]="hotel.activo ? 'success' : 'danger'"></p-tag>
          </td>
          <td>
            <p-button icon="pi pi-pencil" class="mr-2" [rounded]="true" [outlined]="true" (click)="edit(hotel)" />
            <p-button icon="pi pi-trash" severity="danger" [rounded]="true" [outlined]="true" (click)="deleteOne(hotel)" />
          </td>
        </tr>
      </ng-template>
    </p-table>

    <p-dialog [(visible)]="dialogVisible" [style]="{ width: '600px' }" header="Hotel" [modal]="true">
      <ng-template #content>
        <div class="grid grid-cols-12 gap-4">
          <div class="col-span-12 md:col-span-8">
            <label class="block font-bold mb-2">Nombre</label>
            <input type="text" pInputText [(ngModel)]="hotel.nombre" required autofocus />
            <small class="text-red-500" *ngIf="submitted && !hotel.nombre">Requerido.</small>
          </div>
          <div class="col-span-12 md:col-span-4">
            <label class="block font-bold mb-2">Estrellas</label>
           <p-select [(ngModel)]="hotel.estrellas" [options]="estrellasOpts"></p-select> 
          </div>

          <div class="col-span-12 md:col-span-6">
            <label class="block font-bold mb-2">País</label>
            <input pInputText [(ngModel)]="hotel.pais" />
          </div>
          <div class="col-span-12 md:col-span-6">
            <label class="block font-bold mb-2">Ciudad</label>
            <input pInputText [(ngModel)]="hotel.ciudad" />
          </div>

          <div class="col-span-12">
            <label class="block font-bold mb-2">Dirección (línea 1)</label>
            <input pInputText [(ngModel)]="hotel.linea1" />
          </div>
          <div class="col-span-12">
            <label class="block font-bold mb-2">Dirección (línea 2)</label>
            <input pInputText [(ngModel)]="hotel.linea2" />
          </div>

          <div class="col-span-12 md:col-span-4">
            <label class="block font-bold mb-2">Código Postal</label>
            <input pInputText [(ngModel)]="hotel.codigoPostal" />
          </div>

          <div class="col-span-6 md:col-span-4">
            <label class="block font-bold mb-2">Check-in desde</label>
            <p-inputMask mask="99:99" placeholder="HH:mm" [(ngModel)]="hotel.checkInDesde"></p-inputMask>
            <small class="text-red-500" *ngIf="submitted && !isHHMM(hotel.checkInDesde)">Formato HH:mm</small>
          </div>
          <div class="col-span-6 md:col-span-4">
            <label class="block font-bold mb-2">Check-out hasta</label>
            <p-inputMask mask="99:99" placeholder="HH:mm" [(ngModel)]="hotel.checkOutHasta"></p-inputMask>
            <small class="text-red-500" *ngIf="submitted && !isHHMM(hotel.checkOutHasta)">Formato HH:mm</small>
          </div>

          <div class="col-span-12" *ngIf="hotel.id">
            <label class="block font-bold mb-2">Activo</label>
            <p-toggleButton onLabel="Sí" offLabel="No" [(ngModel)]="hotel.activo"></p-toggleButton>
          </div>
        </div>
      </ng-template>

      <ng-template #footer>
        <p-button label="Cancelar" icon="pi pi-times" text (click)="hideDialog()" />
        <p-button label="Guardar" icon="pi pi-check" (click)="save()" />
      </ng-template>
    </p-dialog>

    <p-confirmdialog [style]="{ width: '450px' }" />
    <p-toast />
  `,
  providers: [MessageService, ConfirmationService]
})
export class HotelesCrudComponent implements OnInit {
  @ViewChild('dt') dt!: Table;

  dialogVisible = false;
  submitted = false;

  rows = signal<HotelDTO[]>([]);
  selectedRows!: HotelDTO[] | null;

  hotel!: Partial<HotelDTO>;  // se usa para both: create/update
  estrellasOpts = [1,2,3,4,5];

  cols!: Column[];
  exportColumns!: ExportColumn[];

  constructor(
    private svc: HotelesService,
    private messageService: MessageService,
    private confirmationService: ConfirmationService
  ) {}

  ngOnInit() {
    this.load();
    this.cols = [
      { field: 'nombre', header: 'Nombre' },
      { field: 'estrellas', header: 'Estrellas' },
      { field: 'ciudad', header: 'Ciudad' },
      { field: 'pais', header: 'País' },
      { field: 'checkInDesde', header: 'Check-in' },
      { field: 'checkOutHasta', header: 'Check-out' },
      { field: 'activo', header: 'Activo' },
    ];
    this.exportColumns = this.cols.map(c => ({ title: c.header, dataKey: c.field }));
  }

  load() {
    this.svc.listar().subscribe({
      next: (data: HotelDTO[]) => this.rows.set(data),
      error: _ => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar hoteles' })
    });
  }

  exportCSV() {
    this.dt.exportCSV();
  }

  onGlobalFilter(table: Table, event: Event) {
    table.filterGlobal((event.target as HTMLInputElement).value, 'contains');
  }

  openNew() {
    this.hotel = {
      nombre: '',
      estrellas: 1,
      pais: '',
      ciudad: '',
      linea1: '',
      linea2: '',
      codigoPostal: '',
      checkInDesde: '',
      checkOutHasta: '',
      activo: true
    };
    this.submitted = false;
    this.dialogVisible = true;
  }

  edit(h: HotelDTO) {
    this.hotel = { ...h };
    this.dialogVisible = true;
  }

  hideDialog() {
    this.dialogVisible = false;
    this.submitted = false;
  }

  isHHMM(v?: string) { return !!v && HH_MM.test(v); }

  save() {
    this.submitted = true;
    if (!this.hotel?.nombre?.trim() || !this.isHHMM(this.hotel.checkInDesde) || !this.isHHMM(this.hotel.checkOutHasta)) return;

    const _rows = this.rows();

    if (this.hotel.id) {
      // UPDATE (puede incluir 'activo' u otros)
      const id = this.hotel.id;
      this.svc.actualizar(id, this.hotel as Partial<HotelDTO>).subscribe({
        next: (updated: any) => {
          const i = _rows.findIndex(r => r.id === id);
          if (i >= 0) _rows[i] = updated;
          this.rows.set([..._rows]);
          this.messageService.add({ severity: 'success', summary: 'Actualizado', detail: 'Hotel actualizado' });
          this.dialogVisible = false;
        },
        error: _ => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo actualizar' })
      });
    } else {
      // CREATE → mapear al CreateDTO (sin id/activo)
      const create: HotelCreateDTO = {
        nombre: this.hotel.nombre!,
        estrellas: Number(this.hotel.estrellas ?? 1),
        pais: this.hotel.pais ?? '',
        ciudad: this.hotel.ciudad ?? '',
        linea1: this.hotel.linea1 ?? '',
        linea2: this.hotel.linea2 ?? '',
        codigoPostal: this.hotel.codigoPostal ?? '',
        checkInDesde: this.hotel.checkInDesde!,
        checkOutHasta: this.hotel.checkOutHasta!,
      };
      this.svc.crear(create).subscribe({
        next: created => {
          this.rows.set([..._rows, created]);
          this.messageService.add({ severity: 'success', summary: 'Creado', detail: 'Hotel creado' });
          this.dialogVisible = false;
        },
        error: _ => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo crear' })
      });
    }
  }

  deleteSelected() {
    this.confirmationService.confirm({
      message: '¿Eliminar los hoteles seleccionados?',
      header: 'Confirmar',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        // elimina uno por uno en backend
        const toDelete = [...(this.selectedRows ?? [])];
        const after = () => {
          this.selectedRows = null;
          this.messageService.add({ severity: 'success', summary: 'Eliminados', detail: 'Hoteles eliminados' });
        };
        if (!toDelete.length) return;
        let pending = toDelete.length;
        toDelete.forEach(h => {
          this.svc.eliminar(h.id).subscribe({
            next: _ => {
              const list = this.rows().filter(r => r.id !== h.id);
              this.rows.set(list);
              if (--pending === 0) after();
            },
            error: _ => {
              this.messageService.add({ severity: 'error', summary: 'Error', detail: `No se pudo eliminar ${h.nombre}` });
              if (--pending === 0) after();
            }
          });
        });
      }
    });
  }

  deleteOne(h: HotelDTO) {
    this.confirmationService.confirm({
      message: `¿Eliminar hotel «${h.nombre}»?`,
      header: 'Confirmar',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.svc.eliminar(h.id).subscribe({
          next: _ => {
            this.rows.set(this.rows().filter(x => x.id !== h.id));
            this.messageService.add({ severity: 'success', summary: 'Eliminado', detail: 'Hotel eliminado' });
          },
          error: _ => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo eliminar' })
        });
      }
    });
  }
}