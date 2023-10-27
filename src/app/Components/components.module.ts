import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { MenuComponent } from './menu/menu.component';
import { OptionsComponent } from './options/options.component';
import { PerfilComponent } from './perfil/perfil.component';
import { LoadingComponent } from './loading/loading.component';
import { HistoryComponent } from './history/history.component';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table';
import { DetailComponent } from './detail/detail.component';


@NgModule({
   
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    MatTableModule,
    MatPaginatorModule,
    MatProgressSpinnerModule
    
  ],

  declarations: [
    MenuComponent,
    OptionsComponent,
    PerfilComponent,
    LoadingComponent,
    HistoryComponent,
    DetailComponent
  ],
  exports: [
    MenuComponent,
    OptionsComponent,
    PerfilComponent,
    LoadingComponent,
    HistoryComponent,
    DetailComponent
],

})
export class ComponentsModule {}
