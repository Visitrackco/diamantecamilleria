import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { MotivosFormPage } from './motivos-form.page';

const routes: Routes = [
  {
    path: '',
    component: MotivosFormPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class MotivosFormPageRoutingModule {}
