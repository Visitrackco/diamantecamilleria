import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';
import { NgApexchartsModule } from 'ng-apexcharts';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';

import { AuditoriaPageRoutingModule } from './auditoria-routing.module';
import { AuditoriaPage } from './auditoria.page';
import { AyudaAuditoriaComponent } from './ayuda-auditoria/ayuda-auditoria.component';
import { ComponentsModule } from 'src/app/Components/components.module';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    AuditoriaPageRoutingModule,
    ComponentsModule,
    NgApexchartsModule,
    MatFormFieldModule,
    MatInputModule,
    MatDatepickerModule,
    MatNativeDateModule
  ],
  declarations: [AuditoriaPage, AyudaAuditoriaComponent]
})
export class AuditoriaPageModule {}
