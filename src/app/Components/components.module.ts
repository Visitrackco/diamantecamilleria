import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { MenuComponent } from './menu/menu.component';
import { OptionsComponent } from './options/options.component';
import { PerfilComponent } from './perfil/perfil.component';
import { LoadingComponent } from './loading/loading.component';


@NgModule({
   
  imports: [
    CommonModule,
    FormsModule,
    IonicModule
    
  ],

  declarations: [
    MenuComponent,
    OptionsComponent,
    PerfilComponent,
    LoadingComponent
  ],
  exports: [
    MenuComponent,
    OptionsComponent,
    PerfilComponent,
    LoadingComponent
],

})
export class ComponentsModule {}
