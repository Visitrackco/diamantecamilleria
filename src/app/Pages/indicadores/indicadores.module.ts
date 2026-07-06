import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { IndicadoresPageRoutingModule } from './indicadores-routing.module';
import { IndicadoresPage } from './indicadores.page';
import { ComponentsModule } from 'src/app/Components/components.module';
import { IndicadoresSharedModule } from './indicadores-shared.module';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    IndicadoresPageRoutingModule,
    ComponentsModule,
    IndicadoresSharedModule
  ],
  declarations: [IndicadoresPage]
})
export class IndicadoresPageModule {}
