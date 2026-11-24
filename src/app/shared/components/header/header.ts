
import {
  Component,
  ElementRef,
  HostListener,
  ViewChild,
  signal
} from '@angular/core';

import {
  NavigationEnd,
  Router,
  RouterLink,
  RouterLinkActive
} from '@angular/router';

import { filter } from 'rxjs';
import { Cart } from '../../../core/services/cart';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [
    RouterLink,
    RouterLinkActive
  ],
  templateUrl: './header.html',
  styleUrl: './header.scss'
})
export class Header {

  isMobileMenuOpen = false;
  isProfileMenuOpen = false;

  isLoggedIn = signal(false);

  // Customer details Signals
  customerName = signal('My Account');

  customerInitial = signal('U');

  constructor(
    public cartService: Cart,
    private router: Router
  ) {
    this.updateCustomerSession();

    this.router.events
      .pipe(
        filter(event => event instanceof NavigationEnd)
      )
      .subscribe(() => {
        this.updateCustomerSession();
      });
  }

  // Update login and customer details
  private updateCustomerSession(): void {

    const isLoggedIn = this.hasLoginSession();

    this.isLoggedIn.set(isLoggedIn);

    if (!isLoggedIn) {
      this.customerName.set('My Account');
      this.customerInitial.set('U');
      return;
    }

    try {

      const savedUser = localStorage.getItem('nutnest-user');

      if (!savedUser) return;

      const user = JSON.parse(savedUser);

      const name = user.name?.trim();

      if (name) {
        this.customerName.set(name);
        this.customerInitial.set(name.charAt(0).toUpperCase());
      }

    } catch (error) {
      console.error('Unable to load customer details:', error);
    }
  }

  private hasLoginSession(): boolean {
    return typeof localStorage !== 'undefined' &&
      !!localStorage.getItem('nutnest-access-token');
  }

  // Mobile Menu
  toggleMobileMenu(): void {
    this.isMobileMenuOpen = !this.isMobileMenuOpen;
  }

  closeMobileMenu(): void {
    this.isMobileMenuOpen = false;
  }

  // Profile Dropdown
  toggleProfileMenu(): void {
    this.isProfileMenuOpen = !this.isProfileMenuOpen;
  }

  closeProfileMenu(): void {
    this.isProfileMenuOpen = false;
  }

  // Open Customer Profile
  openProfile(): void {
    this.closeProfileMenu();
    this.closeMobileMenu();
    this.router.navigate(['/profile']);
  }

  // Open Customer Orders
  openOrders(): void {
    this.closeProfileMenu();
    this.closeMobileMenu();
    this.router.navigate(['/my-orders']);
  }

  // Logout
  logout(): void {
    this.closeProfileMenu();
    this.closeMobileMenu();

    localStorage.removeItem('nutnest-access-token');
    localStorage.removeItem('nutnest-user');

    this.isLoggedIn.set(false);
    this.customerName.set('My Account');
    this.customerInitial.set('U');

    this.router.navigate(['/login']);
  }

  @ViewChild('customerProfile')
  customerProfile!: ElementRef<HTMLElement>;

  // Close dropdown when clicking outside
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {

    if (
      this.isProfileMenuOpen &&
      !this.customerProfile?.nativeElement.contains(event.target as Node)
    ) {
      this.closeProfileMenu();
    }
  }

  // Close dropdown using Escape key
  @HostListener('document:keydown.escape')
  onEscapeKey(): void {
    this.closeProfileMenu();
  }
}
