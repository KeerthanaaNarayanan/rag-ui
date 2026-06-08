import { Component } from '@angular/core';
import { Shell } from './layout/shell/shell';
import { Toast } from './components/toast/toast';

@Component({
  selector: 'app-root',
  imports: [Shell, Toast],
  template: '<app-shell></app-shell><app-toast></app-toast>',
  styleUrl: './app.css'
})
export class App {}
