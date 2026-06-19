import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AppDialogComponent } from './components/app-dialog/app-dialog.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, AppDialogComponent],
  template: `
    <router-outlet></router-outlet>
    <app-dialog></app-dialog>
  `,
  styles: []
})
export class AppComponent {
  title = 'ia-learning-frontend';
} 