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
import { InputNumberModule } from 'primeng/inputnumber';
import { DialogModule } from 'primeng/dialog';
import { TagModule } from 'primeng/tag';
import { InputIconModule } from 'primeng/inputicon';
import { IconFieldModule } from 'primeng/iconfield';
import { SelectModule } from 'primeng/select';

import { MessageService, ConfirmationService } from 'primeng/api';
import { HotelDTO } from '@/interfaces/hotel.model';
import { HabitacionesService } from '@/services/habitacion';
import { HotelesService } from '@/services/hotel';
import { HabitacionCreateDTO, HabitacionDTO, Page } from '@/interfaces/habitacion.model';


@Component({
  selector: 'app-habitaciones-crud',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    TableModule, ToolbarModule, ButtonModule, RippleModule, ToastModule,
    ConfirmDialogModule, InputTextModule, InputNumberModule, DialogModule,
    TagModule, InputIconModule, IconFieldModule, SelectModule
  ],
  templateUrl: './habitacion.html'
    
  ,
  providers: [MessageService, ConfirmationService]
})
export class HabitacionesCrudComponent implements OnInit {
  @ViewChild('dt') dt!: Table;

  // selector hotel
  hotelId: string | null = null;
  hotelesOptions: {label: string, value: string}[] = [];

  // tabla remota
  rows = signal<HabitacionDTO[]>([]);
  total = 0;
  pageIndex = 0;
  pageSize = 10;

  // dialog
  dialogVisible = false;
  habitacion!: Partial<HabitacionDTO>; // create/update buffer

  tiposOptions = [
    { label: 'STANDARD', value: 'STANDARD' },
    { label: 'DELUXE', value: 'DELUXE' },
    { label: 'SUITE', value: 'SUITE' }
  ];

  constructor(
    private habitacionesSvc: HabitacionesService,
    private hotelesSvc: HotelesService,
    private toast: MessageService,
    private confirm: ConfirmationService
  ) {}

  ngOnInit(): void {
    // carga hoteles para selector
    this.hotelesSvc.listar().subscribe({
      next: (hoteles: HotelDTO[]) => {
        this.hotelesOptions = hoteles.map(h => ({ label: h.nombre, value: h.id }));
      }
    });
  }

  onHotelChange() {
    this.pageIndex = 0;
    this.reload();
  }

  loadLazy(e: any) {
    // e.first = índice global (0-based), e.rows = tamaño de página
    this.pageSize = e.rows ?? this.pageSize;
    this.pageIndex = Math.floor((e.first ?? 0) / this.pageSize);
    this.reload();
  }

  reload() {
    if (!this.hotelId) {
      this.rows.set([]);
      this.total = 0;
      return;
    }
    this.habitacionesSvc.listarPorHotel(this.hotelId, this.pageIndex, this.pageSize).subscribe({
      next: (page: Page<HabitacionDTO>) => {
        this.rows.set(page.content);
        this.total = page.totalElements;
      },
      error: _ => this.toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudo cargar habitaciones' })
    });
  }

  openNew() {
    this.habitacion = {
      hotelId: this.hotelId ?? undefined,
      tipo: 'STANDARD',
      capacidad: 1,
      precioBase: 0
    };
    this.dialogVisible = true;
  }

  edit(row: HabitacionDTO) {
    this.habitacion = { ...row };
    this.dialogVisible = true;
  }

  hideDialog() { this.dialogVisible = false; }

  save() {
    if (!this.habitacion?.hotelId || !this.habitacion.numero || !this.habitacion.tipo) {
      this.toast.add({ severity: 'warn', summary: 'Validación', detail: 'Completa Hotel, Número y Tipo' });
      return;
    }

    if (this.habitacion.id) {
      // UPDATE
      const id = this.habitacion.id;
      this.habitacionesSvc.actualizar(id, this.habitacion).subscribe({
        next: _ => { this.dialogVisible = false; this.reload(); this.toast.add({severity:'success', summary:'Actualizado'}); },
        error: _ => this.toast.add({severity:'error', summary:'Error', detail:'No se pudo actualizar'})
      });
    } else {
      // CREATE: map a CreateDTO
      const dto: HabitacionCreateDTO = {
        hotelId: this.habitacion.hotelId!,
        numero: this.habitacion.numero!,
        tipo: this.habitacion.tipo!,
        capacidad: Number(this.habitacion.capacidad ?? 1),
        precioBase: Number(this.habitacion.precioBase ?? 0),
        descripcion: this.habitacion.descripcion ?? ''
      };
      this.habitacionesSvc.crear(dto).subscribe({
        next: _ => { this.dialogVisible = false; this.reload(); this.toast.add({severity:'success', summary:'Creado'}); },
        error: _ => this.toast.add({severity:'error', summary:'Error', detail:'No se pudo crear'})
      });
    }
  }

  deleteOne(row: HabitacionDTO) {
    this.confirm.confirm({
      message: `¿Eliminar habitación ${row.numero}?`,
      header: 'Confirmar',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.habitacionesSvc.eliminar(row.id).subscribe({
          next: _ => { this.reload(); this.toast.add({severity:'success', summary:'Eliminado'}); },
          error: _ => this.toast.add({severity:'error', summary:'Error', detail:'No se pudo eliminar'})
        });
      }
    });
  }

  onGlobalFilter(table: Table, event: Event) {
    table.filterGlobal((event.target as HTMLInputElement).value, 'contains');
  }

  estadoSeverity(estado: string) {
    switch (estado) {
      case 'DISPONIBLE': return 'success';
      case 'OCUPADA': return 'warning';
      case 'MANTENIMIENTO': return 'danger';
      default: return 'info';
    }
  }
}