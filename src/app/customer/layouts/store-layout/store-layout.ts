import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { Header } from '../../../shared/components/header/header';
import { Footer } from '../../../shared/components/footer/footer';

@Component({
  selector: 'app-store-layout',
  standalone: true,
 imports: [
    RouterOutlet,
    Header,
    Footer
  ],
  templateUrl: './store-layout.html',
  styleUrl: './store-layout.scss'
})
export class StoreLayout {

}