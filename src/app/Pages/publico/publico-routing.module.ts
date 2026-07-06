import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { PublicoPage } from './publico.page';

const routes: Routes = [
  {
    path: '',
    component: PublicoPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class PublicoPageRoutingModule {}
