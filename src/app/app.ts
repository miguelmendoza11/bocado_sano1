import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Confetti } from './shared/confetti/confetti';
import { Toasts } from './shared/toast/toast';

@Component({
  imports: [RouterOutlet, Toasts, Confetti],
  selector: 'app-root',
  styleUrl: './app.scss',
  templateUrl: './app.html',
})
export class App {}
