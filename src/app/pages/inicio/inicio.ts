import { Component } from '@angular/core';
import { CalorieRing } from '../../shared/calorie-ring/calorie-ring';

@Component({
  selector: 'app-inicio',
  imports: [CalorieRing],
  templateUrl: './inicio.html',
  styleUrl: './inicio.scss',
})
export class Inicio {}
