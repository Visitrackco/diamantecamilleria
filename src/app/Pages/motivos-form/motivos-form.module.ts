import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { MotivosFormPageRoutingModule } from './motivos-form-routing.module';

import { MotivosFormPage } from './motivos-form.page';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table';
import { ComponentsModule } from 'src/app/Components/components.module';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    MotivosFormPageRoutingModule,
    ComponentsModule,
    MatTableModule,
    MatPaginatorModule,
    MatProgressSpinnerModule
  ],
  declarations: [MotivosFormPage]
})
export class MotivosFormPageModule {}
