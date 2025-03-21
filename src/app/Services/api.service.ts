

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

// http://localhost:4000
    postUser(data: any) {
        return fetch('http://localhost:4000/users', {
            method: 'POST',
            body: JSON.stringify(data),
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
        }).then((response) => response.json().then(async (value: any) => value))

    }

    async getUser(data: any) {
        const token = await this.stg.get('tokenweb')
        return fetch('http://localhost:4000/users?Login=' + data.Login + '&Password=' + data.Password, {
            method: 'GET',
            headers: {
                'x-web': token
            }
        }).then((response) => response.json().then(async (value: any) => value))

    }

    getLocationByZone(data: any) {
        return fetch('http://localhost:4000/locations?WorkZoneID=' + data.WorkZoneID, {
            method: 'GET',
            headers: {
                'x-token' : data['token']
            }
        }).then((response) => response.json().then(async (value: any) => value))

    }

    async googleSingIn(data: any) {
        const token = await this.stg.get('tokenweb')
        return fetch('http://localhost:4000/googleSingIn', {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'x-web': token
            },
            body: JSON.stringify(data)
        }).then((response) => response.json().then(async (value: any) => value))

    }

    getWorkZones(data: any) {
        return fetch('http://localhost:4000/workzonesList', {
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
        return fetch('http://localhost:4000/session', {
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

    getWMotivos(WorkZoneID: any, token) {
        return fetch('http://localhost:4000/motivos?WorkZoneID=' + WorkZoneID, {
            method: 'GET',
            headers: {
                'x-token' : token
            }
        }).then((response) => {
           

            return response.json().then(async (value: any) => value );

        })

    }


    CreateActivity(data: any) {
        return fetch('http://localhost:4000/CreateActivity', {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'x-token': data.token
            },
            body: JSON.stringify(data)
        }).then((response) => {
            console.log(response)
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


    getDate(data: any) {
        return fetch('http://localhost:4000/date?format=' + data.format, {
            method: 'GET',
            headers: {
         
                'x-token': data.token
            },
           
        }).then((response) => {
            console.log(response)
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


    closeSession(data: any) {
        return fetch('http://localhost:4000/closeSession', {
            method: 'GET',
            headers: {
         
                'x-token': data.token
            },
           
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
    
    


    apiGet(service, token) {
 
        return fetch('http://localhost:4000/' + service, {
            method: 'GET',
            headers: {
             
                'x-token': token
            },
        
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

        }).catch(() => {
         
            return {
                status: false,
                err: 'No se pudo completar la solicitud, verifique su red o comuniquese con el administrador'
            }
        })

    }

    apiDelete(service, token) {
      
        return fetch('http://localhost:4000/' + service, {
            method: 'DELETE',
            headers: {
             
                'x-token': token
            },
        
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

        }).catch(() => {
        
            return {
                status: false,
                err: 'No se pudo completar la solicitud, verifique su red o comuniquese con el administrador'
            }
        })

    }

    apiPost(service, data: any) {
        return fetch('http://localhost:4000/' + service, {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'x-token': data.token
            },
            body: JSON.stringify(data)
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

        }).catch(() => {
            this.toast.MsgOK('No se pudo completar la solicitud, verifique su red o comuniquese con el administrador')

            return {
                status: false,
                err: 'No se pudo completar la solicitud, verifique su red o comuniquese con el administrador'
            }
        })

    }


    

}



