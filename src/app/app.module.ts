import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { RouteReuseStrategy } from '@angular/router';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { IonicModule, IonicRouteStrategy } from '@ionic/angular';

import { AppComponent } from './app.component';
import { AppRoutingModule } from './app-routing.module';
import { ReactiveFormsModule } from '@angular/forms';
import { ComponentsModule } from './Components/components.module';
import { IonicStorageModule } from '@ionic/storage-angular';
import { Drivers, Storage } from '@ionic/storage';
import { LoginGuard } from './Guards/login.guard';
import { PageGuard } from './Guards/page.guard';
import { FormRNGGuard } from './Guards/formrng.guard';
import { FormMEDGuard } from './Guards/formmed.guard';


@NgModule({
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  declarations: [AppComponent],
  imports: [BrowserModule, IonicModule.forRoot(), AppRoutingModule,
    BrowserAnimationsModule,
    ReactiveFormsModule,
    ComponentsModule,
    IonicStorageModule.forRoot({
      name: 'camilleria',
      driverOrder: [Drivers.IndexedDB, Drivers.SecureStorage, Drivers.LocalStorage]
    }),
   
  ],
  providers: [LoginGuard, PageGuard, FormRNGGuard, FormMEDGuard, Storage,{ provide: RouteReuseStrategy, useClass: IonicRouteStrategy }],
  bootstrap: [AppComponent],
})
export class AppModule {}
