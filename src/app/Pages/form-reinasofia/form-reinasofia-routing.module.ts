import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { FormReinaSofiaPage } from './form-reinasofia.page';

const routes: Routes = [
  {
    path: '',
    component: FormReinaSofiaPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class FormReinaSofiaPageRoutingModule {}
