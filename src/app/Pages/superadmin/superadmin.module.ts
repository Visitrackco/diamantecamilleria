import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { SuperAdminPageRoutingModule } from './superadmin-routing.module';
import { SuperAdminPage } from './superadmin.page';
import { ComponentsModule } from 'src/app/Components/components.module';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    SuperAdminPageRoutingModule,
    ComponentsModule,
    MatSlideToggleModule
  ],
  declarations: [SuperAdminPage]
})
export class SuperAdminPageModule {}
