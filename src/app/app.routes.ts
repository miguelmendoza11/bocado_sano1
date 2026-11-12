import { Routes } from '@angular/router';
import { authGuard, guestGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  // Páginas fuera del layout (sin barra lateral ni inferior)
  {
    path: 'bienvenida',
    canActivate: [guestGuard],
    title: 'Bienvenida · Bocado Sano',
    loadComponent: () => import('./pages/bienvenida/bienvenida').then((m) => m.Bienvenida),
  },
  {
    path: 'login',
    canActivate: [guestGuard],
    title: 'Iniciar sesión · Bocado Sano',
    loadComponent: () => import('./pages/login/login').then((m) => m.Login),
  },
  {
    path: 'registro',
    canActivate: [guestGuard],
    title: 'Registro · Bocado Sano',
    loadComponent: () => import('./pages/registro/registro').then((m) => m.Registro),
  },

  // Páginas dentro del layout (Shell)
  {
    path: '',
    // Sin sesión no se entra: el guard manda a /bienvenida
    canActivate: [authGuard],
    loadComponent: () => import('./layout/shell/shell').then((m) => m.Shell),
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'inicio' },
      {
        path: 'inicio',
        title: 'Inicio · Bocado Sano',
        loadComponent: () => import('./pages/inicio/inicio').then((m) => m.Inicio),
      },
      {
        path: 'diario',
        title: 'Diario · Bocado Sano',
        loadComponent: () => import('./pages/diario/diario').then((m) => m.Diario),
      },
      {
        path: 'recetas',
        title: 'Recetas · Bocado Sano',
        loadComponent: () => import('./pages/recetas/recetas').then((m) => m.Recetas),
      },
      {
        path: 'recetas/:id',
        title: 'Receta · Bocado Sano',
        loadComponent: () =>
          import('./pages/receta-detalle/receta-detalle').then((m) => m.RecetaDetalle),
      },
      {
        path: 'progreso',
        title: 'Progreso · Bocado Sano',
        loadComponent: () => import('./pages/progreso/progreso').then((m) => m.Progreso),
      },
      {
        path: 'perfil',
        title: 'Perfil · Bocado Sano',
        loadComponent: () => import('./pages/perfil/perfil').then((m) => m.Perfil),
      },
    ],
  },

  // Cualquier ruta desconocida va a la raíz y el guard decide (bienvenida o inicio)
  { path: '**', redirectTo: '' },
];
