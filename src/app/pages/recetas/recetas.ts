import { TitleCasePipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { RecipeService } from '../../core/services/recipe.service';

@Component({
  selector: 'app-recetas',
  imports: [RouterLink, TitleCasePipe],
  templateUrl: './recetas.html',
  styleUrl: './recetas.scss',
})
export class Recetas {
  protected readonly recipeService = inject(RecipeService);
}
