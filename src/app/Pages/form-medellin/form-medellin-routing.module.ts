import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { FormMedellinPage } from './form-medellin.page';

const routes: Routes = [
  {
    path: '',
    component: FormMedellinPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class FormMedellinPageRoutingModule {}
