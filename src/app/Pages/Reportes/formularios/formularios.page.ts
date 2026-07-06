import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup } from '@angular/forms';
import * as moment from 'moment-timezone';
import * as XLSX from 'xlsx';

import { ApiService } from 'src/app/Services/api.service';
import { StorageWebService } from 'src/app/Services/storage.service';
import { ToastService } from 'src/app/Services/toast.service';

interface MonthCell {
  year: number;
  mes: number;
  total: number;
}

interface FormularioRow {
  SurveyID: number;
  Title: string;
  Description: string;
  totalAnual: number;
  distribucionMensual: MonthCell[];
  promedioMensualActivo: number;
  promedioMensualPeriodo: number;
}

const FORM_DISPLAY_NAME = 'Formulario de Solicitud';

@Component({
  selector: 'app-formularios',
  templateUrl: './formularios.page.html',
  styleUrls: ['./formularios.page.scss'],
})
export class FormulariosPage implements OnInit {

  myForm: FormGroup<any>;

  loading = false;
  loadData = false;
  load = false;

  fechaFrom: string;
  fechaTo: string;

  dateServer: string;
  dateTime: string;

  myZone;

  totalAnualGlobal = 0;
  promedioMensualGlobal = 0;

  formularios: FormularioRow[] = [];

  monthsColumns = ['mes', 'cantidad'];
  monthLabels = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

  constructor(
    private api: ApiService,
    private stg: StorageWebService,
    private toast: ToastService,
    private fb: FormBuilder
  ) { }

  ngOnInit() { }

  ionViewWillEnter() {
    moment.locale('en');
    this.loadForm();
    this.midata();
  }

  ionViewWillLeave() {
    this.clear();
  }

  loadForm() {
    this.myForm = this.fb.group({
      from: new FormControl(''),
      to: new FormControl('')
    });
  }

  async midata() {
    const login = await this.stg.getLogin();
    if (login) {
      this.load = true;
      this.myZone = login[0].WorkZone;
    }
  }

  async changePicker(event: any, type: number) {
    const login = await this.stg.getLogin();
    if (!login) return;

    const server = await this.api.getDate({
      token: login[0].token,
      format: 'America/Bogota'
    });

    this.dateServer = server.date;
    this.dateTime = server.time;

    const fecha = moment(event.value).utc().format('YYYY-MM-DD');

    if (type === 1) {
      this.fechaFrom = moment(fecha + ' 00:00:00').utc().format('YYYY-MM-DD HH:mm:ss');
    } else {
      if (fecha < moment(this.dateServer).format('YYYY-MM-DD')) {
        this.fechaTo = moment(fecha + ' 23:59:59').utc().format('YYYY-MM-DD HH:mm:ss');
      } else {
        this.fechaTo = moment(fecha + ' ' + this.dateTime + ':59').utc().format('YYYY-MM-DD HH:mm:ss');
      }
    }

    if (this.fechaFrom && this.fechaTo) {
      this.getReport();
    }
  }

  async getReport() {
    const login = await this.stg.getLogin();
    if (!login) return;

    this.loading = true;
    this.loadData = false;
    this.formularios = [];

    this.api.apiPost('reports/formularios', {
      token: login[0].token,
      WorkZoneID: login[0].WorkZone,
      Format: 'America/Bogota',
      Desde: this.fechaFrom,
      Hasta: this.fechaTo,
      isAdmin: 0,
      IsDeleted: 0,
      isAllStatus: 1
    }).then((data: any) => {
      this.loading = false;
      this.loadData = true;

      if (!data || !data.status) {
        this.toast.MsgError(data && data.err ? data.err : 'Error al cargar el reporte');
        return;
      }

      const r = data.response || {};
      this.totalAnualGlobal = r.totalAnualGlobal || 0;
      this.promedioMensualGlobal = r.promedioMensualGlobal || 0;

      const rows: FormularioRow[] = (r.formularios || [])
        .filter((f: FormularioRow) => f.totalAnual > 0)
        .map((f: FormularioRow) => ({ ...f, Title: FORM_DISPLAY_NAME }))
        .sort((a: FormularioRow, b: FormularioRow) => b.totalAnual - a.totalAnual);

      this.formularios = rows;
    });
  }

  clear() {
    this.fechaFrom = '';
    this.fechaTo = '';
    this.totalAnualGlobal = 0;
    this.promedioMensualGlobal = 0;
    this.formularios = [];
    this.loadData = false;

    if (this.myForm) {
      this.myForm.controls['from'].setValue('');
      this.myForm.controls['to'].setValue('');
    }
  }

  monthLabel(cell: MonthCell): string {
    return `${this.monthLabels[cell.mes - 1]} ${cell.year}`;
  }

  fmt(n: number): string {
    if (n === null || n === undefined || isNaN(n)) return '0';
    return Number(n).toLocaleString('es-CO', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    });
  }

  exportExcel() {
    if (!this.formularios.length) return;

    const f = this.formularios[0];

    const rows: any[] = f.distribucionMensual.map(m => ({
      'MES': this.monthLabel(m),
      'CANTIDAD': m.total
    }));

    rows.push({ 'MES': 'TOTAL', 'CANTIDAD': f.totalAnual });
    rows.push({ 'MES': 'PROMEDIO MENSUAL', 'CANTIDAD': f.promedioMensualPeriodo });

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(rows);
    XLSX.utils.book_append_sheet(wb, ws, f.Title);
    XLSX.writeFile(wb, 'Reporte_Formularios.xlsx');
  }
}
