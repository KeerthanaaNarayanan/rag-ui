import { Routes } from '@angular/router';

export const routes: Routes = [
	{
		path: '',
		pathMatch: 'full',
		redirectTo: 'query',
	},
	{
		path: 'ingest',
		loadComponent: () => import('./pages/ingest/ingest').then((m) => m.Ingest),
	},
	{
		path: 'query',
		loadComponent: () => import('./pages/query/query').then((m) => m.Query),
	},
	{
		path: 'collections',
		loadComponent: () => import('./pages/collections/collections').then((m) => m.Collections),
	},
	{
		path: '**',
		redirectTo: 'query',
	},
];
