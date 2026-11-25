import { Component, signal,inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Loading } from './core/services/loading';
import { Toast } from './core/services/toast';
@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  protected readonly title = signal('dryfruits-frontend');
   loadingService = inject(Loading);
  toastService = inject(Toast);
}
