

import { Injectable } from '@angular/core';
import { Router } from '@angular/router';


import { LoadingController } from '@ionic/angular';
import { Storage } from '@ionic/storage-angular';
import { StorageWebService } from './storage.service';
import { ToastService } from './toast.service';


@Injectable({
    providedIn: 'root'
})


export class ApiService {
    constructor(
        private loadingc: LoadingController,
        private toast: ToastService,
        private stg: Storage,
        private router: Router
    ) { }


    postUser(data: any) {
        return fetch('https://diamanteticvisitrack.com/users', {
            method: 'POST',
            body: JSON.stringify(data),
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
        }).then((response) => response.json().then(async (value: any) => value))

    }

    getUser(data: any) {
        return fetch('https://diamanteticvisitrack.com/users?Login=' + data.Login + '&Password=' + data.Password, {
            method: 'GET',
        }).then((response) => response.json().then(async (value: any) => value))

    }

    getLocationByZone(data: any) {
        return fetch('https://diamanteticvisitrack.com/locations?WorkZoneID=' + data.WorkZoneID, {
            method: 'GET',
        }).then((response) => response.json().then(async (value: any) => value))

    }

    googleSingIn(data: any) {
        return fetch('https://diamanteticvisitrack.com/googleSingIn', {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        }).then((response) => response.json().then(async (value: any) => value))

    }

    getWorkZones(data: any) {
        return fetch('https://diamanteticvisitrack.com/workzonesList', {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        }).then((response) => response.json().catch((err) => {

            this.toast.MsgError('Error al cargar las zonas')
        }).then(async (value: any) => value)).catch((err) => {
            this.toast.MsgError('Error al cargar las zonas')
        })

    }

    getSessions(data: any) {
        return fetch('https://diamanteticvisitrack.com/session', {
            method: 'GET',
            headers: {
                'x-token': data.token
            }
        }).then((response) => {
            if (response.status == 401) {
                return response.json().then(async (value: any) => {

                    this.toast.MsgError(value.err)
                    this.stg.set('login', [])
                    this.router.navigate(['/home'])
                    return;



                })
            }

            return response.json().then(async (value: any) => value );

        })

    }

    getWMotivos(WorkZoneID: any) {
        return fetch('https://diamanteticvisitrack.com/motivos?WorkZoneID=' + WorkZoneID, {
            method: 'GET',

        }).then((response) => {
           

            return response.json().then(async (value: any) => value );

        })

    }

}



