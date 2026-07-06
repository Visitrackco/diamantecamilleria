import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { NgApexchartsModule } from 'ng-apexcharts';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSelectModule } from '@angular/material/select';

import { CamilleriaComponent } from './pages/camilleria/camilleria.component';
import { Camilleria2Component } from './pages/camilleria2/camilleria2.component';
import { MapacalorComponent } from './pages/mapacalor/mapacalor.component';
import { MapacumplimientoComponent } from './pages/mapacumplimiento/mapacumplimiento.component';
import { Camilleria4Component } from './pages/camilleria4/camilleria4.component';
import { CompartirDialogComponent } from './compartir-dialog/compartir-dialog.component';

// Módulo compartido con las 4 pantallas del dashboard BI. Se reutiliza tanto en el
// dashboard interno (IndicadoresPageModule) como en la vista pública (PublicoPageModule).
@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    NgApexchartsModule,
    MatFormFieldModule,
    MatInputModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatSlideToggleModule,
    MatSelectModule
  ],
  declarations: [
    CamilleriaComponent,
    Camilleria2Component,
    MapacalorComponent,
    MapacumplimientoComponent,
    Camilleria4Component,
    CompartirDialogComponent
  ],
  exports: [
    CamilleriaComponent,
    Camilleria2Component,
    MapacalorComponent,
    MapacumplimientoComponent,
    Camilleria4Component,
    CompartirDialogComponent
  ]
})
export class IndicadoresSharedModule {}
