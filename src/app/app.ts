import { Component } from '@angular/core';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { Shell } from './layout/shell/shell';
import { Toast } from './components/toast/toast';

@Component({
  selector: 'app-root',
  imports: [BrowserAnimationsModule, Shell, Toast],
  template: '<app-shell></app-shell><app-toast></app-toast>',
  styleUrl: './app.css'
})
export class App {}
