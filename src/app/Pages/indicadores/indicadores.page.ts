import { Component, OnInit } from '@angular/core';

interface BiPage {
  key: string;
  label: string;
}

@Component({
  selector: 'app-indicadores',
  templateUrl: './indicadores.page.html',
  styleUrls: ['./indicadores.page.scss'],
})
export class IndicadoresPage implements OnInit {

  collapsed = false;
  selectedPage = 'camilleria';

  // Páginas del dashboard (equivalente a las "Páginas" de Power BI)
  pages: BiPage[] = [
    { key: 'camilleria', label: 'CAMILLERIA' },
    { key: 'camilleria2', label: 'CAMILLERIA 2' },
    { key: 'mapacalor', label: 'MAPA DE CALOR' },
    { key: 'mapacumplimiento', label: 'MAPA DE CUMPLIMIENTO' },
    { key: 'camilleria4', label: 'CAMILLERIA 4' },
    { key: 'ayudas', label: 'AYUDAS DIAGNOSTICAS' },
    { key: 'cantidad', label: 'CANTIDAD DE CAMILLEROS' },
    { key: 'nfc', label: 'USO DE NFC' },
  ];

  constructor() { }

  ngOnInit() { }

  get currentLabel(): string {
    const p = this.pages.find((x) => x.key === this.selectedPage);
    return p ? p.label : '';
  }

  select(key: string) {
    this.selectedPage = key;
  }

  toggleSidebar() {
    this.collapsed = !this.collapsed;
  }

}
