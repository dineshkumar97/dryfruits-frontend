
import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-terms-conditions',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './terms-conditions.html',
  styleUrl: './terms-conditions.scss'
})
export class TermsConditions {
  lastUpdated = '23 November 2026';
}
