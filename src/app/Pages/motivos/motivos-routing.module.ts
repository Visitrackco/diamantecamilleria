import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { MotivosPage } from './motivos.page';

const routes: Routes = [
  {
    path: '',
    component: MotivosPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class MotivosPageRoutingModule {}
