// src/app/pages/reservas/reservas-crud.component.ts
import { Component, OnInit, ViewChild, signal, inject } from '@angular/core';
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
import { ReservaCreateDTO, ReservaDTO } from '@/interfaces/reserva.model';
import { ReservasService } from '@/services/reserva';
import { HotelesService } from '@/services/hotel';
import { HabitacionesService } from '@/services/habitacion';
import { HotelDTO } from '@/interfaces/hotel.model';
import { HabitacionDTO } from '@/interfaces/habitacion.model';
import { FacturasService } from '@/services/factura';
import { FacturaCreateDTO, FacturaDTO } from '@/interfaces/factura.model';

// NEW: servicio + modelo de usuarios
//import { UsersService } from '@/services/users.service';
import { UserDTO } from '@/interfaces/user.model';
import { UsersService } from '@/services/user.service';

interface ClienteOpt { label: string; value: string; }

@Component({
  selector: 'app-reservas-crud',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    TableModule, ToolbarModule, ButtonModule, RippleModule, ToastModule,
    ConfirmDialogModule, InputTextModule, InputNumberModule, DialogModule,
    TagModule, InputIconModule, IconFieldModule, SelectModule
  ],
  templateUrl: 'reserva.html',
  providers: [MessageService, ConfirmationService]
})
export class ReservasCrudComponent implements OnInit {
  @ViewChild('dt') dt!: Table;

  // filtros
  hotelId: string | null = null;

  // opciones
  hotelesOptions: { label: string; value: string }[] = [];
  habitacionesOptions: { label: string; value: string }[] = [];
  clientesOptions: ClienteOpt[] = [];

  // datos
  rows = signal<ReservaDTO[]>([]);
  nitRegex = /^[0-9A-Za-z-]{2,20}$|^CF$/i;

  // diálogo
  dialogVisible = false;
  buffer!: Partial<ReservaCreateDTO>;

  // caches para mapear ids -> nombres
  cacheHabitaciones = new Map<string, string>();
  cacheClientes = new Map<string, string>();

  constructor(
    private reservasSvc: ReservasService,
    private hotelesSvc: HotelesService,
    private habitacionesSvc: HabitacionesService,
    private toast: MessageService,
    private confirm: ConfirmationService,
    private facturasSvc: FacturasService,
    // NEW
    private usersSvc: UsersService
  ) {}

  invoiceVisible = false;
  invoice: Partial<FacturaCreateDTO> = {};
  monedas = [{ label: 'GTQ', value: 'GTQ' }, { label: 'USD', value: 'USD' }];
  series  = [{ label: 'A', value: 'A' }, { label: 'B', value: 'B' }, { label: 'N', value: 'N' }];

  ngOnInit(): void {
    this.hotelesSvc.listar().subscribe({
      next: (hoteles: HotelDTO[]) => {
        this.hotelesOptions = hoteles.map((h) => ({ label: h.nombre, value: h.id }));
      }
    });

    this.cargarClientes(); // NEW: trae CLIENTE
  }

  // NEW: listar clientes (usa interceptor para Bearer)
  private cargarClientes() {
    this.usersSvc.listar({ rol: 'CLIENTE', size: 100 }).subscribe({
      next: (arr: UserDTO[]) => {
        const list = arr ?? [];
        this.clientesOptions = list.map(u => ({ label: `${u.nombre} (${u.email})`, value: u.id }));
        this.cacheClientes.clear();
        list.forEach(u => this.cacheClientes.set(u.id, u.nombre));
      },
      error: _ => this.toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar clientes' })
    });
  }

  onHotelChange() {
    this.load();
    this.cargarHabitaciones();
  }

  cargarHabitaciones() {
    this.habitacionesOptions = [];
    this.cacheHabitaciones.clear();
    const hid = this.buffer?.hotelId || this.hotelId;
    if (!hid) return;
    this.habitacionesSvc.listarPorHotel(hid, 0, 50).subscribe({
      next: (page) => {
        const list = (Array.isArray(page) ? page : page.content) as HabitacionDTO[];
        this.habitacionesOptions = list.map((h) => ({ label: `${h.numero} (${h.tipo})`, value: h.id }));
        list.forEach((h) => this.cacheHabitaciones.set(h.id, `${h.numero} (${h.tipo})`));
      }
    });
  }

  load() {
    if (!this.hotelId) { this.rows.set([]); return; }
    this.reservasSvc.listarPorHotel(this.hotelId, 0, 50).subscribe({
      next: (data) => this.rows.set(data),
      error: (_) => this.toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar reservas' })
    });
  }

  openNew() {
    if (!this.hotelId) return;
    this.buffer = { hotelId: this.hotelId, huespedes: 1, entrada: '', salida: '' };
    this.dialogVisible = true;
    this.cargarHabitaciones();
  }

  hideDialog() { this.dialogVisible = false; }

  save() {
    if (!this.buffer?.hotelId || !this.buffer.habitacionId || !this.buffer.clienteId || !this.buffer.entrada || !this.buffer.salida || !this.buffer.huespedes) {
      this.toast.add({ severity: 'warn', summary: 'Validación', detail: 'Completa todos los campos.' });
      return;
    }
    const dto = this.buffer as ReservaCreateDTO;
    this.reservasSvc.crear(dto).subscribe({
      next: (_) => { this.dialogVisible = false; this.load(); this.toast.add({ severity: 'success', summary: 'Reserva creada' }); },
      error: (_) => this.toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudo crear la reserva' })
    });
  }

  doCheckin(r: ReservaDTO) {
    this.reservasSvc.checkin(r.id).subscribe({
      next: (res) => { this.replaceRow(res); this.toast.add({ severity: 'success', summary: 'Check-in realizado' }); },
      error: (_) => this.toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudo hacer check-in' })
    });
  }

  doCheckout(r: ReservaDTO) {
    this.reservasSvc.checkout(r.id).subscribe({
      next: (res) => { this.replaceRow(res); this.toast.add({ severity: 'success', summary: 'Check-out realizado' }); this.openFacturaDialog(res); },
      error: (_) => this.toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudo hacer check-out' })
    });
  }

  doCancelar(r: ReservaDTO) {
    this.confirm.confirm({
      message: `¿Cancelar la reserva ${r.id}?`,
      header: 'Confirmar', icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.reservasSvc.cancelar(r.id).subscribe({
          next: (res) => { this.replaceRow(res); this.toast.add({ severity: 'success', summary: 'Reserva cancelada' }); },
          error: (_) => this.toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudo cancelar' })
        });
      }
    });
  }

  replaceRow(res: ReservaDTO) {
    const list = this.rows();
    const i = list.findIndex((x) => x.id === res.id);
    if (i >= 0) list[i] = res; else list.unshift(res);
    this.rows.set([...list]);
  }

  onGlobalFilter(table: Table, ev: Event) { table.filterGlobal((ev.target as HTMLInputElement).value, 'contains'); }

  estadoSeverity(estado: string) {
    switch (estado) {
      case 'RESERVADA': return 'info';
      case 'CHECKED_IN': return 'warning';
      case 'CHECKED_OUT': return 'success';
      case 'CANCELADA': return 'danger';
      default: return 'secondary';
    }
  }

  mapHabitacion(id: string) { return this.cacheHabitaciones.get(id) || id; }
  mapCliente(id: string)    { return this.cacheClientes.get(id) || id; }

  openFacturaDialog(r: ReservaDTO) {
    this.invoice = {
      reservaId: r.id,
      moneda: 'GTQ',
      serie: 'A',
      clienteNit: 'CF',
      clienteNombre: this.mapCliente(r.clienteId) || ''
    };
    this.invoiceVisible = true;
  }

  emitirFactura() {
    const inv = this.invoice;
    if (!inv?.reservaId || !inv.moneda || !inv.serie || !inv.clienteNit || !inv.clienteNombre) {
      this.toast.add({severity:'warn', summary:'Validación', detail:'Completa todos los campos.'}); return;
    }
    if (!this.nitRegex.test(inv.clienteNit)) {
      this.toast.add({severity:'warn', summary:'Validación', detail:'NIT inválido (usa CF o NIT válido).'}); return;
    }
    this.facturasSvc.emitir(inv as any).subscribe({
      next: (f: FacturaDTO) => {
        this.invoiceVisible = false;
        this.toast.add({severity:'success', summary:'Factura emitida', detail:`Serie ${f.serie} No. ${f.numero}`});
      },
      error: _ => this.toast.add({severity:'error', summary:'Error', detail:'No se pudo emitir la factura'})
    });
  }
}