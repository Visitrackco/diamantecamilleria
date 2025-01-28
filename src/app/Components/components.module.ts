import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MenuComponent } from './menu/menu.component';
import { OptionsComponent } from './options/options.component';
import { PerfilComponent } from './perfil/perfil.component';
import { LoadingComponent } from './loading/loading.component';
import { HistoryComponent } from './history/history.component';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table';
import { DetailComponent } from './detail/detail.component';
import { VersionActivitiesComponent } from './version-activities/version-activities.component';
import { DescansosComponent } from './descansos/descansos.component';
import { CustomOptionComponent } from './asociative/asociative.component';
import { MatNativeDateModule } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';


@NgModule({
   
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    MatTableModule,
    MatPaginatorModule,
    MatProgressSpinnerModule,
    ReactiveFormsModule,

    MatSelectModule,
    MatFormFieldModule,
    MatInputModule,

    MatDatepickerModule,
    MatNativeDateModule

    
  ],

  declarations: [
    MenuComponent,
    OptionsComponent,
    PerfilComponent,
    LoadingComponent,
    HistoryComponent,
    DetailComponent,
    VersionActivitiesComponent,
    DescansosComponent,
    CustomOptionComponent
  ],
  exports: [
    MenuComponent,
    OptionsComponent,
    PerfilComponent,
    LoadingComponent,
    HistoryComponent,
    DetailComponent,
    VersionActivitiesComponent,
    DescansosComponent,
    CustomOptionComponent
],

})
export class ComponentsModule {}
