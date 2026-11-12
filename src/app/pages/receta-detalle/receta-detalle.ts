import { Component, input, numberAttribute } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-receta-detalle',
  imports: [RouterLink],
  templateUrl: './receta-detalle.html',
  styleUrl: './receta-detalle.scss',
})
export class RecetaDetalle {
  /** Viene de la URL /recetas/:id gracias a withComponentInputBinding(). */
  readonly id = input.required({ transform: numberAttribute });
}
