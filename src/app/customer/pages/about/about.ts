
import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-about',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './about.html',
  styleUrl: './about.scss'
})
export class About {

  features = [
    {
      icon: '✦',
      title: 'Premium Quality',
      description: 'Carefully selected dry fruits with a focus on quality.'
    },
    {
      icon: '🌿',
      title: 'Natural Goodness',
      description: 'Enjoy the natural taste and goodness of dry fruits.'
    },
    {
      icon: '📦',
      title: 'Fresh Packaging',
      description: 'Packed with care to help maintain freshness.'
    },
    {
      icon: '♡',
      title: 'Customer First',
      description: 'Your satisfaction and trust matter to us.'
    }
  ];

}
