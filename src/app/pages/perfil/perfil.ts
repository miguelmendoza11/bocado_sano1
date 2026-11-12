import { Component, computed, inject } from '@angular/core';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-perfil',
  templateUrl: './perfil.html',
  styleUrl: './perfil.scss',
})
export class Perfil {
  protected readonly auth = inject(AuthService);

  /** Iniciales para el avatar: "Juan Montezuma" → "JM", "ana" → "A". */
  protected readonly initials = computed(() => {
    const name = this.auth.user()?.name ?? '';
    return name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((word) => word[0].toUpperCase())
      .join('');
  });
}
