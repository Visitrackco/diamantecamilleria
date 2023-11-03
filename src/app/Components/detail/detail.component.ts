import { Component, Input, OnInit } from '@angular/core';

@Component({
  selector: 'app-detail',
  templateUrl: './detail.component.html',
  styleUrls: ['./detail.component.scss'],
})
export class DetailComponent  implements OnInit {

  @Input() data;

  constructor() { }

  ngOnInit() {}


  ionViewWillEnter() {
    console.log(this.data)

    let adicional = this.data.acc.JSONAnswers.filter((item) => item.apiId == 'ADICIONAL').length > 0 
    ? this.data.acc.JSONAnswers.filter((item) => item.apiId == 'ADICIONAL')[0].Value
    : '';


    let solicitado = this.data.acc.JSONAnswers.filter((item) => item.apiId == 'NOMBRE').length > 0 
    ? this.data.acc.JSONAnswers.filter((item) => item.apiId == 'NOMBRE')[0].Value
    : '';

   

    this.data.adicional = adicional;
    this.data.solicitado = solicitado;
  }

}
