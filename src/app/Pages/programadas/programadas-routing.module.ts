import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { ProgramadasPage } from './programadas.page';

const routes: Routes = [
  {
    path: '',
    component: ProgramadasPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ProgramadasPageRoutingModule {}
