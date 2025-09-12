// src/app/pages/cuentas/cuentas-crud.component.ts
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

import { MessageService, ConfirmationService } from 'primeng/api';
import { CuentasService } from '@/services/cuenta-service';
import { PlatillosService } from '@/services/platillo-service';
import { RestaurantesService } from '@/services/restaurante';
import { CuentaCreateDTO, CuentaDTO, ConsumoCreateDTO, ConsumoDTO } from '@/interfaces/cuenta.model';
import { RestauranteDTO } from '@/interfaces/restaurante.model';
import { PlatilloDTO } from '@/interfaces/platillo.model';

import { FacturasRestService } from '@/services/facturas-rest';
import { FacturaRestDTO } from '@/interfaces/factura-rest.model';

@Component({
    selector: 'app-cuentas-crud',
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
                    <p-select class="w-20rem" [(ngModel)]="restauranteId" [options]="restaurantesOptions" optionLabel="label" optionValue="value" (onChange)="onRestauranteChange()" />
                    <p-button label="Abrir cuenta" icon="pi pi-plus" (onClick)="openNewCuenta()" />
                    <p-button label="Refrescar" icon="pi pi-refresh" severity="secondary" (onClick)="loadBase()" />
                </div>
            </ng-template>
            <ng-template #end>
                <p-iconfield>
                    <p-inputicon styleClass="pi pi-search" />
                    <input pInputText type="text" [(ngModel)]="q" (input)="applyFilters()" placeholder="Buscar por mesa..." />
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
            currentPageReportTemplate="Mostrando {first} a {last} de {{ filteredRowsAll.length }} cuentas"
            (onPage)="onPage($event)"
        >
            <ng-template #header>
                <tr>
                    <th>Mesa</th>
                    <th>Estado</th>
                    <th class="text-right">Subtotal</th>
                    <th class="text-right">Impuesto</th>
                    <th class="text-right">Propina</th>
                    <th class="text-right">Total</th>
                    <th style="width: 14rem"></th>
                </tr>
            </ng-template>

            <ng-template #body let-c>
                <tr>
                    <td class="font-semibold">{{ c.mesa }}</td>
                    <td>
                        <p-tag [value]="c.estado" [severity]="c.estado === 'ABIERTA' ? 'warning' : c.estado === 'CERRADA' ? 'info' : 'success'"></p-tag>
                    </td>
                    <td class="text-right">{{ c.subtotal | number: '1.2-2' }}</td>
                    <td class="text-right">{{ c.impuesto | number: '1.2-2' }}</td>
                    <td class="text-right">{{ c.propina | number: '1.2-2' }}</td>
                    <td class="text-right">{{ c.total | number: '1.2-2' }}</td>
                    <td class="text-right">
                        <p-button label="Consumos" icon="pi pi-list" class="mr-2" [outlined]="true" (click)="openConsumos(c)" />
                        <p-button label="Cerrar" icon="pi pi-lock" class="mr-2" [outlined]="true" [disabled]="c.estado !== 'ABIERTA'" (click)="cerrarCuenta(c)" />
                        <p-button label="Cobrar" icon="pi pi-dollar" severity="success" [disabled]="c.estado !== 'CERRADA'" (click)="cobrarCuentaYEmitir(c)" />
                    </td>
                </tr>
            </ng-template>
        </p-table>

        <!-- Abrir cuenta -->
        <p-dialog [(visible)]="dialogCuentaVisible" [modal]="true" [style]="{ width: '460px' }" header="Abrir cuenta">
            <ng-template #content>
                <div class="flex flex-col gap-4">
                    <div>
                        <label class="block font-bold mb-2">Restaurante</label>
                        <p-select [(ngModel)]="bufferCuenta.restauranteId" [options]="restaurantesOptionsSinTodos" optionLabel="label" optionValue="value" styleClass="w-full" />
                        <small class="text-red-500" *ngIf="submittedCuenta && !bufferCuenta.restauranteId">Selecciona un restaurante.</small>
                    </div>
                    <div>
                        <label class="block font-bold mb-2">Mesa</label>
                        <input pInputText [(ngModel)]="bufferCuenta.mesa" placeholder="Ej. M1" [ngClass]="{ 'p-invalid': submittedCuenta && !isMesaValida() }" />
                        <small class="text-red-500" *ngIf="submittedCuenta && !isMesaValida()">La mesa es obligatoria.</small>
                    </div>
                </div>
            </ng-template>
            <ng-template #footer>
                <p-button label="Cancelar" icon="pi pi-times" text (click)="dialogCuentaVisible = false" />
                <p-button label="Abrir" icon="pi pi-check" (click)="saveCuenta()" />
            </ng-template>
        </p-dialog>

        <!-- Consumos -->
        <p-dialog [(visible)]="dialogConsumosVisible" [modal]="true" [style]="{ width: '920px' }" header="Consumos de cuenta">
            <ng-template #content>
                <div class="mb-3">
                    <div class="text-sm opacity-80">
                        Cuenta: <b>{{ cuentaSeleccionada?.mesa }}</b> – Estado:
                        <p-tag [value]="cuentaSeleccionada?.estado || ''" [severity]="cuentaSeleccionada?.estado === 'ABIERTA' ? 'warning' : cuentaSeleccionada?.estado === 'CERRADA' ? 'info' : 'success'"></p-tag>
                    </div>
                </div>

                <div class="grid grid-cols-12 gap-4">
                    <div class="col-span-12 md:col-span-8">
                        <p-table [value]="consumos()">
                            <ng-template #header>
                                <tr>
                                    <th>Platillo</th>
                                    <th>Precio</th>
                                    <th>Cant.</th>
                                    <th>Subtotal</th>
                                    <th>Nota</th>
                                    <th style="width: 7rem"></th>
                                </tr>
                            </ng-template>
                            <ng-template #body let-x>
                                <tr>
                                    <td class="font-medium">{{ x.nombre }}</td>
                                    <td>{{ x.precioUnitario | number: '1.2-2' }}</td>
                                    <td>{{ x.cantidad }}</td>
                                    <td>{{ x.subtotal | number: '1.2-2' }}</td>
                                    <td>{{ x.nota }}</td>
                                    <td class="text-right">
                                        <p-button icon="pi pi-pencil" [rounded]="true" [outlined]="true" class="mr-2" (click)="editConsumo(x)" />
                                        <p-button icon="pi pi-trash" severity="danger" [rounded]="true" [outlined]="true" (click)="removeConsumo(x)" />
                                    </td>
                                </tr>
                            </ng-template>
                        </p-table>
                    </div>

                    <div class="col-span-12 md:col-span-4">
                        <div class="p-3 border rounded-lg">
                            <div class="font-bold mb-2">Agregar / Editar consumo</div>

                            <label class="block font-bold mb-1">Platillo (opcional)</label>
                            <p-select class="w-full mb-3" [(ngModel)]="bufferConsumo.platilloId" [options]="platillosOptions" optionLabel="label" optionValue="value" (onChange)="onPlatilloChange()" placeholder="Selecciona platillo" />

                            <label class="block font-bold mb-1">Nombre</label>
                            <input pInputText class="mb-2 w-full" [(ngModel)]="bufferConsumo.nombre" [ngClass]="{ 'p-invalid': submittedConsumo && !isNombreConsumoValido() }" />
                            <small class="text-red-500" *ngIf="submittedConsumo && !isNombreConsumoValido()">Mínimo 3 caracteres.</small>

                            <div class="grid grid-cols-12 gap-3 mt-2">
                                <div class="col-span-6">
                                    <label class="block font-bold mb-1">Precio unitario</label>
                                    <p-inputNumber [(ngModel)]="bufferConsumo.precioUnitario" [min]="0.01" [max]="100000" [useGrouping]="false" [ngClass]="{ 'p-invalid': submittedConsumo && !isPrecioValido() }"></p-inputNumber>
                                </div>
                                <div class="col-span-6">
                                    <label class="block font-bold mb-1">Cantidad</label>
                                    <p-inputNumber [(ngModel)]="bufferConsumo.cantidad" [min]="1" [max]="999" [useGrouping]="false" [ngClass]="{ 'p-invalid': submittedConsumo && !isCantidadValida() }"></p-inputNumber>
                                </div>
                            </div>

                            <label class="block font-bold mb-1 mt-3">Nota</label>
                            <input pInputText class="w-full mb-3" [(ngModel)]="bufferConsumo.nota" />

                            <div class="flex gap-2">
                                <p-button label="{{ bufferConsumo.id ? 'Actualizar' : 'Agregar' }}" icon="pi pi-check" (click)="saveConsumo()" />
                                <p-button *ngIf="bufferConsumo.id" label="Cancelar edición" text icon="pi pi-times" (click)="cancelEditConsumo()" />
                            </div>
                        </div>
                    </div>
                </div>
            </ng-template>
            <ng-template #footer>
                <div class="text-right w-full">
                    <span class="mr-6"
                        >Total cuenta: <b>{{ cuentaSeleccionada?.total | number: '1.2-2' }}</b></span
                    >
                    <p-button label="Cerrar" icon="pi pi-lock" class="mr-2" [outlined]="true" [disabled]="cuentaSeleccionada?.estado !== 'ABIERTA'" (click)="cerrarCuenta(cuentaSeleccionada!)" />
                    <p-button label="Cobrar" icon="pi pi-dollar" severity="success" [disabled]="cuentaSeleccionada?.estado !== 'CERRADA'" (click)="cobrarCuentaYEmitir(cuentaSeleccionada!)" />
                </div>
            </ng-template>
        </p-dialog>

        <p-confirmDialog />
        <p-toast />

        <!-- Diálogo EMITIR FACTURA -->
        <p-dialog [(visible)]="emitDialogVisible" [modal]="true" [style]="{ width: '860px' }" header="Emitir factura">
            <ng-template #content>
                <div class="grid grid-cols-12 gap-4">
                    <div class="col-span-12 md:col-span-7">
                        <div class="font-bold mb-2">Consumos</div>
                        <p-table [value]="consumos()">
                            <ng-template #header>
                                <tr>
                                    <th>Nombre</th>
                                    <th class="text-right">P.Unit</th>
                                    <th class="text-right">Cant.</th>
                                    <th class="text-right">Subt.</th>
                                </tr>
                            </ng-template>
                            <ng-template #body let-x>
                                <tr>
                                    <td>{{ x.nombre }}</td>
                                    <td class="text-right">{{ x.precioUnitario | number: '1.2-2' }}</td>
                                    <td class="text-right">{{ x.cantidad }}</td>
                                    <td class="text-right">{{ x.subtotal | number: '1.2-2' }}</td>
                                </tr>
                            </ng-template>
                        </p-table>
                    </div>

                    <div class="col-span-12 md:col-span-5">
                        <div class="p-3 border rounded-lg">
                            <div class="font-bold mb-2">Datos de factura</div>

                            <label class="block font-bold mb-1">Serie</label>
                            <input pInputText class="mb-2 w-full" [(ngModel)]="emitBuffer.serie" [ngClass]="{ 'p-invalid': emitSubmitted && !emitBuffer.serie }" />

                            <label class="block font-bold mb-1">Moneda</label>
                            <p-select
                                class="w-full mb-2"
                                [(ngModel)]="emitBuffer.moneda"
                                [options]="[
                                    { label: 'GTQ', value: 'GTQ' },
                                    { label: 'USD', value: 'USD' }
                                ]"
                            />

                            <label class="block font-bold mb-1">NIT (opcional)</label>
                            <input pInputText class="mb-2 w-full" [(ngModel)]="emitBuffer.clienteNit" />

                            <label class="block font-bold mb-1">Nombre cliente (opcional)</label>
                            <input pInputText class="mb-3 w-full" [(ngModel)]="emitBuffer.clienteNombre" />

                            <div class="mb-3">
                                <p-toggleButton [(ngModel)]="emitBuffer.incluirPropina" onLabel="Incluir propina" offLabel="Sin propina" (onChange)="recalcularPreview()"></p-toggleButton>
                            </div>

                            <div class="text-sm space-y-1">
                                <div class="flex justify-between">
                                    <span>Subtotal</span><b>{{ emitPreview.subtotal | number: '1.2-2' }}</b>
                                </div>
                                <div class="flex justify-between">
                                    <span>Impuesto</span><b>{{ emitPreview.impuesto | number: '1.2-2' }}</b>
                                </div>
                                <div class="flex justify-between">
                                    <span>Propina</span><b>{{ emitPreview.propina | number: '1.2-2' }}</b>
                                </div>
                                <div class="flex justify-between text-lg mt-2">
                                    <span>Total</span><b>{{ emitPreview.total | number: '1.2-2' }}</b>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </ng-template>
            <ng-template #footer>
                <p-button label="Cancelar" icon="pi pi-times" text (click)="emitDialogVisible = false" />
                <p-button label="Emitir" icon="pi pi-check" (click)="emitFactura()" />
            </ng-template>
        </p-dialog>
    `,
    providers: [MessageService, ConfirmationService]
})
export class CuentasCrudComponent implements OnInit {
    @ViewChild('dt') dt!: Table;

    // Restaurante
    restauranteId: string | 'ALL' = 'ALL';
    restaurantesOptions: { label: string; value: string }[] = [{ label: 'Selecciona restaurante', value: 'ALL' }];
    restaurantesOptionsSinTodos: { label: string; value: string }[] = [];

    // Listado
    allRows: CuentaDTO[] = [];
    filteredRowsAll: CuentaDTO[] = [];
    rows = signal<CuentaDTO[]>([]);
    pageIndex = 0;
    pageSize = 10;
    q = '';

    // Dialog Abrir cuenta
    dialogCuentaVisible = false;
    submittedCuenta = false;
    bufferCuenta: Partial<CuentaCreateDTO> = { restauranteId: '', mesa: '' };

    // Consumos
    dialogConsumosVisible = false;
    cuentaSeleccionada?: CuentaDTO | null = null;
    consumos = signal<ConsumoDTO[]>([]);
    submittedConsumo = false;
    bufferConsumo: Partial<ConsumoDTO> = { nombre: '', precioUnitario: 0, cantidad: 1, nota: '', platilloId: null };

    // Platillos del restaurante (para autollenar)
    platillosOptions: { label: string; value: string; precio: number; nombre: string }[] = [];

    emitDialogVisible = false;
    emitSubmitted = false;
    emitBuffer = {
        moneda: 'GTQ',
        serie: 'A',
        clienteNit: '',
        clienteNombre: '',
        incluirPropina: true
    };
    emitPreview = { subtotal: 0, impuesto: 0, propina: 0, total: 0 };
    ultimaFacturaEmitida?: FacturaRestDTO;

    constructor(
        private svc: CuentasService,
        private restaurantesSvc: RestaurantesService,
        private platillosSvc: PlatillosService,
        private toast: MessageService,
        private confirm: ConfirmationService,
        private facturasSvc: FacturasRestService
    ) {}

    ngOnInit(): void {
        this.restaurantesSvc.listarTodos().subscribe({
            next: (rs: RestauranteDTO[]) => {
                const arr = rs ?? [];
                this.restaurantesOptions = [{ label: 'Selecciona restaurante', value: 'ALL' }, ...arr.map((r) => ({ label: r.nombre, value: r.id }))];
                this.restaurantesOptionsSinTodos = arr.map((r) => ({ label: r.nombre, value: r.id }));
            }
        });
        this.loadBase();
    }

    loadBase() {
        const rid = this.restauranteId === 'ALL' ? undefined : this.restauranteId;
        this.svc.listar(rid).subscribe({
            next: (arr) => {
                this.allRows = arr ?? [];
                this.applyFilters(true);
            },
            error: (_) => this.toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar cuentas' })
        });
    }

    onRestauranteChange() {
        this.pageIndex = 0;
        this.loadBase();
        this.loadPlatillosForRestaurante();
    }

    openEmitFactura(c: CuentaDTO) {
  if (c.estado !== 'COBRADA') {
    this.toast.add({ severity: 'warn', summary: 'No facturable', detail: 'La cuenta debe estar COBRADA.' });
    return;
  }
  this.cuentaSeleccionada = c;

  // si estabas dentro del modal de consumos, ciérralo para evitar máscaras superpuestas
  this.dialogConsumosVisible = false;

  // carga consumos para la previsualización
  this.svc.listarConsumos(c.id).subscribe({ next: cs => this.consumos.set(cs ?? []) });

  setTimeout(() => {
    this.emitBuffer = { moneda: 'GTQ', serie: 'A', clienteNit: '', clienteNombre: '', incluirPropina: true };
    this.recalcularPreview();
    this.emitSubmitted = false;
    this.emitDialogVisible = true;
  });
}
    recalcularPreview() {
        const c = this.cuentaSeleccionada!;
        const propina = this.emitBuffer.incluirPropina ? c.propina : 0;
        this.emitPreview = {
            subtotal: c.subtotal,
            impuesto: c.impuesto,
            propina,
            total: c.subtotal + c.impuesto + propina
        };
    }

    onPage(e: any) {
        this.pageSize = e.rows ?? this.pageSize;
        this.pageIndex = Math.floor((e.first ?? 0) / this.pageSize);
        this.slicePage();
    }

    applyFilters(resetPage = false) {
        if (resetPage) this.pageIndex = 0;
        let list = [...(this.allRows || [])];

        const q = this.q.trim().toLowerCase();
        if (q) list = list.filter((c) => (c.mesa || '').toLowerCase().includes(q));

        this.filteredRowsAll = list;
        this.slicePage();
    }

    slicePage() {
        const start = this.pageIndex * this.pageSize;
        this.rows.set(this.filteredRowsAll.slice(start, start + this.pageSize));
    }

    // ----- Abrir cuenta -----
    openNewCuenta() {
        this.bufferCuenta = {
            restauranteId: this.restauranteId === 'ALL' ? '' : this.restauranteId,
            mesa: ''
        };
        this.submittedCuenta = false;
        this.dialogCuentaVisible = true;
    }

    isMesaValida() {
        return (this.bufferCuenta.mesa ?? '').toString().trim().length > 0;
    }

    cobrarCuentaYEmitir(c: CuentaDTO) {
  this.confirm.confirm({
    message: `¿Cobrar cuenta de mesa «${c.mesa}» y luego emitir factura?`,
    header: 'Confirmar',
    icon: 'pi pi-exclamation-triangle',
    acceptLabel: 'Cobrar y facturar',
    accept: () => {
      this.svc.cobrar(c.id).subscribe({
        next: () => {
          // refresca datos de la cuenta cobrada
          this.svc.obtener(c.id).subscribe({
            next: (cobrada) => {
              // actualiza en listados
              const idx = this.allRows.findIndex(x => x.id === c.id);
              if (idx >= 0) this.allRows[idx] = cobrada;
              this.applyFilters();

              this.toast.add({ severity: 'success', summary: 'Cuenta cobrada' });

              // abrir diálogo de factura sólo si ya quedó COBRADA
              if (cobrada.estado === 'COBRADA') {
                this.openEmitFactura(cobrada);
              } else {
                this.toast.add({ severity: 'warn', summary: 'No facturable', detail: `Estado actual: ${cobrada.estado}` });
              }
            },
            error: _ => this.toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudo actualizar la cuenta' })
          });
        },
        error: _ => this.toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudo cobrar' })
      });
    }
  });
}

    saveCuenta() {
        this.submittedCuenta = true;
        const rid = (this.bufferCuenta.restauranteId ?? '').toString().trim();
        if (!rid || !this.isMesaValida()) {
            this.toast.add({ severity: 'warn', summary: 'Validación', detail: 'Selecciona restaurante y mesa.' });
            return;
        }
        const dto: CuentaCreateDTO = { restauranteId: rid, mesa: (this.bufferCuenta.mesa ?? '').toString().trim() };
        this.svc.abrir(dto).subscribe({
            next: (c) => {
                this.allRows.unshift(c);
                this.applyFilters(true);
                this.dialogCuentaVisible = false;
                this.toast.add({ severity: 'success', summary: 'Cuenta abierta', detail: `Mesa ${c.mesa}` });
            },
            error: (_) => this.toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudo abrir la cuenta' })
        });
    }

    // ----- Consumos -----
    openConsumos(c: CuentaDTO) {
        this.cuentaSeleccionada = c;
        this.svc.listarConsumos(c.id).subscribe({
            next: (cs) => this.consumos.set(cs ?? []),
            error: (_) => this.toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar consumos' })
        });
        this.bufferConsumo = { nombre: '', precioUnitario: 0, cantidad: 1, nota: '', platilloId: null };
        this.submittedConsumo = false;
        this.dialogConsumosVisible = true;
        this.loadPlatillosForRestaurante();
    }

    loadPlatillosForRestaurante() {
        const rid = this.restauranteId === 'ALL' ? null : this.restauranteId;
        if (!rid) {
            this.platillosOptions = [];
            return;
        }
        this.platillosSvc.listarTodos(rid).subscribe({
            next: (ps: PlatilloDTO[]) => {
                this.platillosOptions = (ps ?? [])
                    .filter((p) => p.enabled !== false)
                    .map((p) => ({
                        label: p.nombre,
                        value: p.id,
                        precio: p.precio,
                        nombre: p.nombre
                    }));
            }
        });
    }

    onPlatilloChange() {
        const opt = this.platillosOptions.find((x) => x.value === this.bufferConsumo.platilloId);
        if (opt) {
            // autocompletar
            this.bufferConsumo.nombre = opt.nombre;
            this.bufferConsumo.precioUnitario = opt.precio;
        }
    }

    isNombreConsumoValido() {
        return (this.bufferConsumo.nombre ?? '').toString().trim().length >= 3;
    }
    isPrecioValido() {
        const n = Number(this.bufferConsumo.precioUnitario);
        return !isNaN(n) && n > 0;
    }
    isCantidadValida() {
        const n = Number(this.bufferConsumo.cantidad);
        return !isNaN(n) && n >= 1;
    }

    saveConsumo() {
        this.submittedConsumo = true;
        if (!this.isNombreConsumoValido() || !this.isPrecioValido() || !this.isCantidadValida()) {
            this.toast.add({ severity: 'warn', summary: 'Validación', detail: 'Revisa nombre, precio y cantidad.' });
            return;
        }
        const cuentaId = this.cuentaSeleccionada!.id;
        const payload: ConsumoCreateDTO = {
            platilloId: this.bufferConsumo.platilloId || null,
            nombre: (this.bufferConsumo.nombre ?? '').toString().trim(),
            precioUnitario: Number(this.bufferConsumo.precioUnitario),
            cantidad: Number(this.bufferConsumo.cantidad),
            nota: (this.bufferConsumo.nota ?? '').toString().trim() || null
        };

        if (this.bufferConsumo.id) {
            const id = this.bufferConsumo.id!;
            this.svc.actualizarConsumo(id, payload).subscribe({
                next: (up) => {
                    const arr = [...this.consumos()];
                    const idx = arr.findIndex((x) => x.id === id);
                    if (idx >= 0) arr[idx] = up;
                    this.consumos.set(arr);
                    this.refreshCuenta(cuentaId);
                    this.toast.add({ severity: 'success', summary: 'Consumo actualizado' });
                    this.cancelEditConsumo();
                },
                error: (_) => this.toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudo actualizar el consumo' })
            });
        } else {
            this.svc.crearConsumo(cuentaId, payload).subscribe({
                next: (created) => {
                    this.consumos.set([created, ...this.consumos()]);
                    this.refreshCuenta(cuentaId);
                    this.toast.add({ severity: 'success', summary: 'Consumo agregado' });
                    this.bufferConsumo = { nombre: '', precioUnitario: 0, cantidad: 1, nota: '', platilloId: null };
                    this.submittedConsumo = false;
                },
                error: (_) => this.toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudo agregar el consumo' })
            });
        }
    }

    editConsumo(x: ConsumoDTO) {
        this.bufferConsumo = { ...x };
        this.submittedConsumo = false;
    }

    cancelEditConsumo() {
        this.bufferConsumo = { nombre: '', precioUnitario: 0, cantidad: 1, nota: '', platilloId: null };
        this.submittedConsumo = false;
    }

    removeConsumo(x: ConsumoDTO) {
        this.confirm.confirm({
            message: `¿Eliminar consumo «${x.nombre}»?`,
            header: 'Confirmar',
            icon: 'pi pi-exclamation-triangle',
            acceptLabel: 'Eliminar',
            accept: () => {
                this.svc.eliminarConsumo(x.id).subscribe({
                    next: (_) => {
                        this.consumos.set(this.consumos().filter((c) => c.id !== x.id));
                        this.refreshCuenta(this.cuentaSeleccionada!.id);
                        this.toast.add({ severity: 'success', summary: 'Consumo eliminado' });
                    },
                    error: (_) => this.toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudo eliminar' })
                });
            }
        });
    }

    // Recalcular totales de la cuenta (obtener nuevamente la cuenta)
    private refreshCuenta(id: string) {
        this.svc.obtener(id).subscribe({
            next: (c) => {
                // actualiza en tabla
                const idx = this.allRows.findIndex((x) => x.id === id);
                if (idx >= 0) this.allRows[idx] = c;
                this.applyFilters();
                // actualiza dialog
                if (this.cuentaSeleccionada && this.cuentaSeleccionada.id === id) {
                    this.cuentaSeleccionada = c;
                }
            }
        });
    }

    // ----- Cerrar / Cobrar -----
    cerrarCuenta(c: CuentaDTO) {
        this.confirm.confirm({
            message: `¿Cerrar cuenta de mesa «${c.mesa}»?`,
            header: 'Confirmar',
            icon: 'pi pi-exclamation-triangle',
            acceptLabel: 'Cerrar',
            accept: () => {
                this.svc.cerrar(c.id).subscribe({
                    next: (_) => {
                        this.refreshCuenta(c.id);
                        this.toast.add({ severity: 'success', summary: 'Cuenta cerrada' });
                    },
                    error: (_) => this.toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudo cerrar' })
                });
            }
        });
    }

    cobrarCuenta(c: CuentaDTO) {
        this.confirm.confirm({
            message: `¿Cobrar cuenta de mesa «${c.mesa}»?`,
            header: 'Confirmar',
            icon: 'pi pi-exclamation-triangle',
            acceptLabel: 'Cobrar',
            accept: () => {
                this.svc.cobrar(c.id).subscribe({
                    next: (_) => {
                        this.refreshCuenta(c.id);
                        this.toast.add({ severity: 'success', summary: 'Cuenta cobrada' });
                    },
                    error: (_) => this.toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudo cobrar' })
                });
            }
        });
    }

    emitFactura() {
        this.emitSubmitted = true;
        if (!this.emitBuffer.serie || !this.emitBuffer.moneda) return;

        // Si necesitas forzar propina 0 en la cuenta antes de emitir, aquí sería el lugar.
        // Si tu backend ya respeta lo que tenga la cuenta al momento de emitir, basta con llamar a emitir().
        // (Opcional para tu backend) this.svc.aplicarPropina(this.cuentaSeleccionada!.id, this.emitBuffer.incluirPropina ? undefined : 0)

        const dto = {
            cuentaId: this.cuentaSeleccionada!.id,
            moneda: this.emitBuffer.moneda,
            serie: this.emitBuffer.serie,
            clienteNit: this.emitBuffer.clienteNit || undefined,
            clienteNombre: this.emitBuffer.clienteNombre || undefined
        };

        console.log(dto);

        this.facturasSvc.emitir(dto).subscribe({
            next: (f) => {
                this.ultimaFacturaEmitida = f;
                this.emitDialogVisible = false;
                this.toast.add({ severity: 'success', summary: 'Factura emitida', detail: `Serie ${f.serie}-${f.numero}` });
                // refresca la cuenta (por si total cambia) y listado
                this.refreshCuenta(this.cuentaSeleccionada!.id);
            },
            error: (_) => this.toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudo emitir la factura' })
        });
    }
}
