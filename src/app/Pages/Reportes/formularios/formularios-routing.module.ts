import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { FormulariosPage } from './formularios.page';

const routes: Routes = [
  {
    path: '',
    component: FormulariosPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class FormulariosPageRoutingModule {}
