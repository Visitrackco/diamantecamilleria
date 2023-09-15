import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { MenuComponent } from './menu/menu.component';
import { OptionsComponent } from './options/options.component';
import { PerfilComponent } from './perfil/perfil.component';


@NgModule({
   
  imports: [
    CommonModule,
    FormsModule,
    IonicModule
    
  ],

  declarations: [
    MenuComponent,
    OptionsComponent,
    PerfilComponent
  ],
  exports: [
    MenuComponent,
    OptionsComponent,
    PerfilComponent
],

})
export class ComponentsModule {}
