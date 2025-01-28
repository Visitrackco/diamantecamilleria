import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { CustomOptionsPage } from './custom-options.page';

const routes: Routes = [
  {
    path: '',
    component: CustomOptionsPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class CustomOptionsPageRoutingModule {}
