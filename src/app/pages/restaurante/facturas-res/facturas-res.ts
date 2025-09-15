// pages/facturas-rest/facturas-rest.component.ts
import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { ToolbarModule } from 'primeng/toolbar';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { DatePickerModule } from 'primeng/datepicker';
import { DialogModule } from 'primeng/dialog';
import { TagModule } from 'primeng/tag';
import { SelectModule } from 'primeng/select';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { MessageService, ConfirmationService } from 'primeng/api';

import { FacturasRestService } from '@/services/facturas-rest';
import { RestaurantesService } from '@/services/restaurante';
import { FacturaRestDTO } from '@/interfaces/factura-rest.model';
import { RestauranteDTO } from '@/interfaces/restaurante.model';

// PDF
import jsPDF from 'jspdf';
import autoTable, { RowInput } from 'jspdf-autotable';

@Component({
  selector: 'app-facturas-rest',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    TableModule, ToolbarModule, ButtonModule, ToastModule,
    DatePickerModule, DialogModule, TagModule, SelectModule, ConfirmDialogModule
  ],
  providers: [ConfirmationService, MessageService],
  template: `
  <p-toolbar styleClass="mb-4">
    <ng-template #start>
      <div class="flex flex-wrap gap-3 items-end">
        <p-select class="w-20rem"
          [(ngModel)]="restauranteId"
          [options]="restOptions"
          optionLabel="label" optionValue="value"
          (onChange)="load()" />
        <p-datepicker
          [(ngModel)]="range"
          selectionMode="range"
          dateFormat="yy-mm-dd"
          (onSelect)="load()"
          placeholder="Rango de fechas" />
        <p-button label="Refrescar" icon="pi pi-refresh" severity="secondary" (onClick)="load()" />
      </div>
    </ng-template>
  </p-toolbar>

  <p-table [value]="rows()" [paginator]="true" [rows]="10" [rowsPerPageOptions]="[10,20,30]">
    <ng-template #header>
      <tr>
        <th>Serie</th>
        <th>#</th>
        <th>Cuenta</th>
        <th>Moneda</th>
        <th class="text-right">Subtotal</th>
        <th class="text-right">Total</th>
        <th>Fecha</th>
        <th>Estado</th>
        <th style="width: 12rem"></th>
      </tr>
    </ng-template>
    <ng-template #body let-f>
      <tr>
        <td>{{ f.serie }}</td>
        <td>{{ f.numero }}</td>
        <td>{{ f.cuentaId | slice:0:8 }}...</td>
        <td>{{ f.moneda }}</td>
        <td class="text-right">{{ f.subtotal | number:'1.2-2' }}</td>
        <td class="text-right">{{ f.total | number:'1.2-2' }}</td>
        <td>{{ f.createdAt | date:'short' }}</td>
        <td><p-tag [value]="f.estado" [severity]="f.estado==='EMITIDA' ? 'success':'danger'"></p-tag></td>
        <td class="text-right">
          <p-button label="Ver" icon="pi pi-eye" [outlined]="true" class="mr-2" (click)="ver(f)" />
          <p-button label="Anular" icon="pi pi-ban" severity="danger" [outlined]="true"
                    [disabled]="f.estado!=='EMITIDA'" (click)="anular(f)" />
        </td>
      </tr>
    </ng-template>
  </p-table>

  <p-dialog [(visible)]="detailVisible" [modal]="true" [style]="{width:'760px'}" header="Factura">
    <ng-template #content>
      <div class="flex items-center justify-between mb-2">
        <div>
          <div class="font-semibold">Serie {{ sel?.serie }} - {{ sel?.numero }} | {{ sel?.moneda }}</div>
          <div class="text-sm opacity-80">Creada: {{ sel?.createdAt | date:'short' }}</div>
        </div>
        <p-button icon="pi pi-file-pdf" label="Descargar PDF" severity="help" (onClick)="exportAsPdf()" />
      </div>

      <div class="mt-3 p-3 border rounded-lg bg-surface-50">
        <div class="text-sm opacity-80">Cuenta ID</div>
        <div class="font-mono text-sm break-all">{{ sel?.cuentaId }}</div>
        <div class="mt-1 text-xs opacity-70">
          <b>Código para valorar tu platillo:</b> usa este <i>Cuenta ID</i> en la sección de reseñas para calificar tus platillos.
        </div>
      </div>

      <p-table class="mt-3" [value]="sel?.items || []">
        <ng-template #header>
          <tr>
            <th>Nombre</th>
            <th class="text-right">P.Unit</th>
            <th class="text-right">Cant.</th>
            <th class="text-right">Subt.</th>
          </tr>
        </ng-template>
        <ng-template #body let-i>
          <tr>
            <td>{{ i.nombre }}</td>
            <td class="text-right">{{ i.precioUnitario | number:'1.2-2' }}</td>
            <td class="text-right">{{ i.cantidad }}</td>
            <td class="text-right">{{ i.subtotal | number:'1.2-2' }}</td>
          </tr>
        </ng-template>
      </p-table>

      <div class="mt-3 text-right space-y-1">
        <div>Subtotal: <b>{{ sel?.subtotal | number:'1.2-2' }}</b></div>
        <div class="text-lg">Total: <b>{{ sel?.total | number:'1.2-2' }}</b></div>
      </div>
    </ng-template>
  </p-dialog>

  <p-confirmDialog />
  <p-toast />
  `
})
export class FacturasRestComponent implements OnInit {
  restauranteId = '';
  restOptions: {label:string,value:string}[] = [];
  range: Date[] | null = null;

  rows = signal<FacturaRestDTO[]>([]);
  sel?: FacturaRestDTO | null;
  detailVisible = false;

  constructor(
    private svc: FacturasRestService,
    private restSvc: RestaurantesService,
    private toast: MessageService,
    private confirm: ConfirmationService
  ) {}

  ngOnInit(): void {
    this.restSvc.listarTodos().subscribe({
      next: (rs: RestauranteDTO[]) => {
        this.restOptions = (rs ?? []).map(r => ({label:r.nombre, value:r.id}));
        if (this.restOptions.length) {
          this.restauranteId = this.restOptions[0].value;
          this.load();
        }
      }
    });
  }

  load() {
    if (!this.restauranteId) return;
    const [d, h] = this.normalizeRange(this.range);
    this.svc.listar(this.restauranteId, d, h).subscribe({
      next: arr => this.rows.set(arr ?? []),
      error: _ => this.toast.add({severity:'error', summary:'Error', detail:'No se pudieron cargar facturas'})
    });
  }

  ver(f: FacturaRestDTO) {
    this.sel = f;
    this.detailVisible = true;
  }

  anular(f: FacturaRestDTO) {
    this.confirm.confirm({
      message: `¿Anular la factura ${f.serie}-${f.numero}?`,
      header: 'Confirmar', icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.svc.anular(f.id).subscribe({
          next: _ => { this.toast.add({severity:'success', summary:'Factura anulada'}); this.load(); },
          error: _ => this.toast.add({severity:'error', summary:'Error', detail:'No se pudo anular'})
        });
      }
    });
  }

  exportAsPdf() {
    if (!this.sel) return;
    const f = this.sel;

    const doc = new jsPDF({ unit: 'pt', format: 'a4' });
    const left = 40;
    let y = 40;

    // Encabezado
    doc.setFontSize(16);
    doc.text(`Factura Restaurante`, left, y); y += 18;
    doc.setFontSize(11);
    doc.text(`Serie: ${f.serie}  |  No.: ${f.numero}`, left, y); y += 14;
    doc.text(`Moneda: ${f.moneda}  |  Fecha: ${new Date(f.createdAt).toLocaleString()}`, left, y); y += 22;

    // CuentaId (código para review)
    doc.setFontSize(10);
    doc.text(`Cuenta ID (código para valorar platillos):`, left, y); y += 12;
    doc.setFont('courier', 'normal').setFontSize(10);
    doc.text(f.cuentaId, left, y); y += 18;
    doc.setFont('helvetica', 'normal');

    // Tabla de items
    const head = [['Nombre', 'P.Unit', 'Cant.', 'Subt.']];
    const body: RowInput[] = (f.items || []).map(i => [
      i.nombre,
      (i.precioUnitario ?? 0).toFixed(2),
      String(i.cantidad ?? 0),
      (i.subtotal ?? 0).toFixed(2)
    ]);
    autoTable(doc, {
      head, body,
      startY: y,
      styles: { fontSize: 10, halign: 'right' },
      headStyles: { halign: 'left' },
      columnStyles: {
        0: { halign: 'left' }, // nombre
      },
      margin: { left, right: left }
    });

    const endY = (doc as any).lastAutoTable.finalY || y;

    // Totales
    doc.setFontSize(11);
    doc.text(`Subtotal: ${f.subtotal.toFixed(2)}`, 400, endY + 24, { align: 'left' });
    doc.setFontSize(12);
    doc.text(`Total: ${f.total.toFixed(2)}`, 400, endY + 42, { align: 'left' });

    // Pie
    doc.setFontSize(9);
    doc.text(`Gracias por su preferencia.`, left, endY + 60);

    doc.save(`Factura_${f.serie}-${f.numero}.pdf`);
  }

  private normalizeRange(range: Date[] | null): [string|undefined, string|undefined] {
    if (!range || range.length < 2) return [undefined, undefined];
    const pad = (n:number)=> n.toString().padStart(2,'0');
    const toYMD = (d:Date)=>`${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
    return [toYMD(range[0]), toYMD(range[1])];
  }
}