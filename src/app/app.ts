import { Component } from '@angular/core';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { Shell } from './layout/shell/shell';

@Component({
  selector: 'app-root',
  imports: [BrowserAnimationsModule, Shell],
  template: '<app-shell></app-shell>',
  styleUrl: './app.css'
})
export class App {}
