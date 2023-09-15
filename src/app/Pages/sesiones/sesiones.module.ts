import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { SesionesPageRoutingModule } from './sesiones-routing.module';

import { SesionesPage } from './sesiones.page';
import { ComponentsModule } from 'src/app/Components/components.module';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    SesionesPageRoutingModule,
    ComponentsModule
  ],
  declarations: [SesionesPage]
})
export class SesionesPageModule {}
