import { Component } from '@angular/core';
import { Shell } from './layout/shell/shell';

@Component({
  selector: 'app-root',
  imports: [Shell],
  template: '<app-shell></app-shell>',
  styleUrl: './app.css'
})
export class App {}
