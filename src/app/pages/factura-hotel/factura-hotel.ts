import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { ToolbarModule } from 'primeng/toolbar';
import { TableModule } from 'primeng/table';
import { SelectModule } from 'primeng/select';
import { DatePickerModule } from 'primeng/datepicker';
import { TagModule } from 'primeng/tag';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { InputIconModule } from 'primeng/inputicon';
import { IconFieldModule } from 'primeng/iconfield';

import { MessageService } from 'primeng/api';
import { MultiSelectModule } from 'primeng/multiselect';

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { FacturaDTO } from '@/interfaces/factura.model';
import { HotelesService } from '@/services/hotel';
import { FacturasService } from '@/services/factura';
import { HotelDTO } from '@/interfaces/hotel.model';

@Component({
    selector: 'app-facturas-hotel',
    standalone: true,
    imports: [CommonModule, MultiSelectModule, FormsModule, ToolbarModule, TableModule, SelectModule, DatePickerModule, TagModule, ButtonModule, ToastModule, DialogModule, InputTextModule, InputIconModule, IconFieldModule],
    template: `
        <p-toolbar styleClass="mb-4">
            <ng-template #start>
                <div class="flex flex-wrap items-end gap-3">
                    <!-- Hotel -->
                    <p-select class="w-20rem" [(ngModel)]="hotelId" [options]="hotelesOptions" optionLabel="label" optionValue="value" placeholder="Selecciona hotel" (onChange)="load()" />

                    <!-- Rango de fechas (frontend) -->
                    <div class="flex flex-col">
                        <label class="text-sm mb-1">Rango de fechas</label>
                        <p-datepicker [(ngModel)]="fechaRango" selectionMode="range" inputId="dp" placeholder="Desde - Hasta" (onSelect)="applyFilters()" dateFormat="yy-mm-dd" styleClass="w-20rem" />
                    </div>

                    <!-- Estado (multi) -->
                    <div class="flex flex-col">
                        <label class="text-sm mb-1">Estado</label>
                        <p-multiSelect [(ngModel)]="filtros.estado" [options]="estadosOptions" optionLabel="label" optionValue="value" defaultLabel="Todos" display="chip" (onChange)="applyFilters()"> </p-multiSelect>
                    </div>

                    <p-button label="Limpiar" icon="pi pi-eraser" severity="secondary" (onClick)="clearFilters()" />
                </div>
            </ng-template>

            <ng-template #end>
                <p-iconfield>
                    <p-inputicon styleClass="pi pi-search" />
                    <input pInputText type="text" [(ngModel)]="filtros.q" (input)="applyFilters()" placeholder="Buscar..." />
                </p-iconfield>
            </ng-template>
        </p-toolbar>

        <p-table [value]="rows" [paginator]="true" [rows]="10" [rowHover]="true" [rowsPerPageOptions]="[10, 20, 30]" dataKey="id" [showCurrentPageReport]="true" currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords} facturas">
            <ng-template #header>
                <tr>
                    <th>Serie/No.</th>
                    <th>Reserva</th>
                    <th>Moneda</th>
                    <th>Subtotal</th>
                    <th>Total</th>
                    <th>Estado</th>
                    <th>Creada</th>
                    <th style="width: 12rem"></th>
                </tr>
            </ng-template>
            <ng-template #body let-f>
                <tr>
                    <td class="font-semibold">{{ f.serie }}-{{ f.numero }}</td>
                    <td>{{ f.reservaId }}</td>
                    <td>{{ f.moneda }}</td>
                    <td>{{ f.subtotal | currency: f.moneda }}</td>
                    <td>{{ f.total | currency: f.moneda }}</td>
                    <td><p-tag [value]="f.estado" [severity]="f.estado === 'EMITIDA' ? 'success' : 'danger'"></p-tag></td>
                    <td>{{ f.createdAt | date: 'short' }}</td>
                    <td class="text-right">
                        <p-button icon="pi pi-eye" label="Ver" size="small" class="mr-2" (click)="verDetalle(f)" />
                        <p-button icon="pi pi-file-pdf" label="PDF" size="small" severity="danger" (click)="exportFacturaPDF(f)" />
                    </td>
                </tr>
            </ng-template>
        </p-table>

        <!-- Diálogo de detalle con estilo "tarjeta" -->
        <p-dialog [(visible)]="detailVisible" [modal]="true" [style]="{ width: '720px' }" header="Detalle de factura">
            <ng-template #content>
                <div *ngIf="detalle" class="flex flex-col gap-3">
                    <div class="surface-card p-3 border-round shadow-1">
                        <div class="flex justify-between items-center mb-2">
                            <div>
                                <div class="text-900 text-lg font-bold">Factura {{ detalle.serie }}-{{ detalle.numero }}</div>
                                <div class="text-600 text-sm">Hotel: {{ detalle.hotelId }}</div>
                                <div class="text-600 text-sm">Reserva: {{ detalle.reservaId }}</div>
                            </div>
                            <div class="text-right">
                                <div class="text-600 text-sm">Fecha</div>
                                <div class="text-900 font-semibold">{{ detalle.createdAt | date: 'short' }}</div>
                            </div>
                        </div>
                        <div class="grid">
                            <div class="col-12 md:col-4">
                                Moneda: <b>{{ detalle.moneda }}</b>
                            </div>
                            <div class="col-12 md:col-4">
                                Impuesto: <b>{{ detalle.impuesto | number: '1.2-2' }}</b>
                            </div>
                            <div class="col-12 md:col-4">
                                Propina: <b>{{ detalle.propina | number: '1.2-2' }}</b>
                            </div>
                        </div>
                    </div>

                    <div class="surface-card p-3 border-round shadow-1">
                        <p-table [value]="detalle.items">
                            <ng-template #header>
                                <tr>
                                    <th>Descripción</th>
                                    <th>Cantidad</th>
                                    <th>Precio</th>
                                    <th>Subtotal</th>
                                </tr>
                            </ng-template>
                            <ng-template #body let-it>
                                <tr>
                                    <td>{{ it.descripcion }}</td>
                                    <td>{{ it.cantidad }}</td>
                                    <td>{{ it.precioUnitario | currency: detalle?.moneda }}</td>
                                    <td>{{ it.subtotal | currency: detalle?.moneda }}</td>
                                </tr>
                            </ng-template>
                            <ng-template #footer>
                                <tr>
                                    <td colspan="3" class="text-right font-semibold">Subtotal</td>
                                    <td class="font-semibold">{{ detalle.subtotal | currency: detalle.moneda }}</td>
                                </tr>
                                <tr>
                                    <td colspan="3" class="text-right font-semibold">Impuesto</td>
                                    <td class="font-semibold">{{ detalle.impuesto | currency: detalle.moneda }}</td>
                                </tr>
                                <tr>
                                    <td colspan="3" class="text-right font-bold">Total</td>
                                    <td class="font-bold">{{ detalle.total | currency: detalle.moneda }}</td>
                                </tr>
                            </ng-template>
                        </p-table>
                    </div>
                </div>
            </ng-template>
            <ng-template #footer>
                <p-button icon="pi pi-file-pdf" label="Descargar PDF" severity="danger" (click)="detalle && exportFacturaPDF(detalle)" />
                <p-button icon="pi pi-times" label="Cerrar" text (click)="detailVisible = false" />
            </ng-template>
        </p-dialog>

        <p-toast />
    `,
    providers: [MessageService]
})
export class FacturasHotelComponent implements OnInit {
    hotelId: string | null = null;
    hotelesOptions: { label: string; value: string }[] = [];

    // datos
    allRows: FacturaDTO[] = []; // fuente completa del backend
    rows: FacturaDTO[] = []; // filtradas en frontend

    // filtros frontend
    fechaRango: Date[] | null = null; // [desde, hasta]
    filtros = { q: '', estado: [] as string[] };

    estadosOptions = [
        { label: 'EMITIDA', value: 'EMITIDA' },
        { label: 'ANULADA', value: 'ANULADA' },
        { label: 'PENDIENTE', value: 'PENDIENTE' }
    ];

    // detalle
    detailVisible = false;
    detalle: FacturaDTO | null = null;

    constructor(
        private hotelesSvc: HotelesService,
        private facturasSvc: FacturasService,
        private toast: MessageService
    ) {}

    ngOnInit(): void {
        this.hotelesSvc.listar().subscribe({
            next: (hs: HotelDTO[]) => (this.hotelesOptions = hs.map((h) => ({ label: h.nombre, value: h.id })))
        });
    }

    load() {
        if (!this.hotelId) {
            this.allRows = this.rows = [];
            return;
        }
        // Trae todo (sin fechas) y filtra en cliente
        this.facturasSvc.listarPorHotel(this.hotelId).subscribe({
            next: (data) => {
                this.allRows = data ?? [];
                this.applyFilters();
            },
            error: (_) => this.toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar facturas' })
        });
    }

    clearFilters() {
        this.fechaRango = null;
        this.filtros = { q: '', estado: [] };
        this.applyFilters();
    }

    verDetalle(f: FacturaDTO) {
        this.detalle = f;
        this.detailVisible = true;
    }

    // ====== FRONTEND FILTERING ======
    applyFilters() {
        const q = (this.filtros.q || '').trim().toLowerCase();
        const estados = this.filtros.estado || [];

        // Rango de fechas (incluye ambos extremos)
        let d0: number | null = null,
            d1: number | null = null;
        if (this.fechaRango && this.fechaRango.length) {
            const [a, b] = this.fechaRango;
            if (a) d0 = new Date(a).setHours(0, 0, 0, 0);
            if (b) d1 = new Date(b).setHours(23, 59, 59, 999);
            if (d0 && !d1) d1 = d0; // un solo día
        }

        this.rows = (this.allRows || []).filter((f) => {
            // texto
            const hayQ = !q || `${f.serie}-${f.numero}`.toLowerCase().includes(q) || (f.reservaId || '').toLowerCase().includes(q) || (f.moneda || '').toLowerCase().includes(q) || (f.estado || '').toLowerCase().includes(q);

            // estado
            const hayEstado = !estados.length || estados.includes(f.estado);

            // fecha
            const t = new Date(f.createdAt).getTime();
            const hayFecha = (d0 == null && d1 == null) || (d0 != null && d1 != null && t >= d0 && t <= d1);

            return hayQ && hayEstado && hayFecha;
        });
    }

    // ====== PDF ======
    exportFacturaPDF(f: FacturaDTO) {
        const doc = new jsPDF();

        doc.setFontSize(16);
        doc.text(`Factura ${f.serie}-${f.numero}`, 14, 16);
        doc.setFontSize(11);
        doc.text(`Hotel: ${f.hotelId}`, 14, 24);
        doc.text(`Reserva: ${f.reservaId}`, 14, 30);
        doc.text(`Fecha: ${new Date(f.createdAt).toLocaleString()}`, 150, 24, { align: 'right' });
        doc.text(`Moneda: ${f.moneda}`, 150, 30, { align: 'right' });

        autoTable(doc, {
            startY: 38,
            head: [['Descripción', 'Cantidad', 'Precio', 'Subtotal']],
            body: f.items.map((i) => [i.descripcion, String(i.cantidad), this.asMoney(i.precioUnitario, f.moneda), this.asMoney(i.subtotal, f.moneda)]),
            styles: { fontSize: 10 },
            headStyles: { fillColor: [22, 160, 133] } // bonito verdoso Sakai
        });

        const y = (doc as any).lastAutoTable.finalY + 8;
        doc.setFontSize(12);
        doc.text(`Subtotal: ${this.asMoney(f.subtotal, f.moneda)}`, 150, y, { align: 'right' });
        doc.text(`Impuesto: ${this.asMoney(f.impuesto, f.moneda)}`, 150, y + 6, { align: 'right' });
        doc.setFontSize(14);
        doc.text(`Total: ${this.asMoney(f.total, f.moneda)}`, 150, y + 14, { align: 'right' });

        doc.save(`Factura_${f.serie}-${f.numero}.pdf`);
    }

    private asMoney(n: number, currency: string) {
        try {
            return new Intl.NumberFormat('es-GT', { style: 'currency', currency }).format(n ?? 0);
        } catch {
            return `${currency} ${Number(n ?? 0).toFixed(2)}`;
        }
    }
}
