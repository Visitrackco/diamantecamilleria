import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { UbicacionesPageRoutingModule } from './ubicaciones-routing.module';

import { UbicacionesPage } from './ubicaciones.page';
import { ComponentsModule } from 'src/app/Components/components.module';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    UbicacionesPageRoutingModule,
    ComponentsModule,
    MatTableModule,
    MatPaginatorModule,
    MatProgressSpinnerModule
  ],
  declarations: [UbicacionesPage]
})
export class UbicacionesPageModule {}
