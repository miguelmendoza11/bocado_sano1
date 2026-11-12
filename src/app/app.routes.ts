import { Routes } from '@angular/router';

export const routes: Routes = [
  // Páginas fuera del layout (sin barra lateral ni inferior)
  {
    path: 'bienvenida',
    title: 'Bienvenida · Bocado Sano',
    loadComponent: () => import('./pages/bienvenida/bienvenida').then((m) => m.Bienvenida),
  },
  {
    path: 'login',
    title: 'Iniciar sesión · Bocado Sano',
    loadComponent: () => import('./pages/login/login').then((m) => m.Login),
  },
  {
    path: 'registro',
    title: 'Registro · Bocado Sano',
    loadComponent: () => import('./pages/registro/registro').then((m) => m.Registro),
  },

  // Páginas dentro del layout (Shell)
  {
    path: '',
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

  // Cualquier ruta desconocida vuelve a inicio
  { path: '**', redirectTo: 'inicio' },
];
