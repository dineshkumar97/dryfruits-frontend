
import {
  Component,
  ElementRef,
  HostListener,
  QueryList,
  ViewChildren,
  signal,
} from '@angular/core';

import {
  NavigationEnd,
  Router,
  RouterLink,
  RouterLinkActive,
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

  // Menu states
  isMobileMenuOpen = false;
  isProfileMenuOpen = false;

  // Login state
  isLoggedIn = signal(false);

  // Customer details
  customerName = signal('My Account');
  customerInitial = signal('U');

  // Header scroll state
  isScrolled = false;

  // Both mobile and desktop profile wrappers
  @ViewChildren('customerProfile')
  customerProfiles!: QueryList<ElementRef<HTMLElement>>;

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
        this.closeMobileMenu();
        this.closeProfileMenu();
      });
  }

  // --------------------------------
  // Header Scroll
  // --------------------------------

  @HostListener('window:scroll')
  onWindowScroll(): void {
    this.isScrolled = window.scrollY > 50;
  }

  // --------------------------------
  // Customer Session
  // --------------------------------

  private updateCustomerSession(): void {

    const loggedIn = this.hasLoginSession();

    this.isLoggedIn.set(loggedIn);

    if (!loggedIn) {
      this.customerName.set('My Account');
      this.customerInitial.set('U');
      return;
    }

    try {
      const savedUser = localStorage.getItem('nutnest-user');

      if (!savedUser) {
        this.customerName.set('My Account');
        this.customerInitial.set('U');
        return;
      }

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

  // --------------------------------
  // Mobile Navigation
  // --------------------------------

  toggleMobileMenu(): void {
    this.isMobileMenuOpen = !this.isMobileMenuOpen;

    if (this.isMobileMenuOpen) {
      this.closeProfileMenu();
    }
  }

  closeMobileMenu(): void {
    this.isMobileMenuOpen = false;
  }

  // --------------------------------
  // Customer Profile Dropdown
  // --------------------------------

  toggleProfileMenu(): void {
    this.isProfileMenuOpen = !this.isProfileMenuOpen;

    if (this.isProfileMenuOpen) {
      this.closeMobileMenu();
    }
  }

  closeProfileMenu(): void {
    this.isProfileMenuOpen = false;
  }

  // Detect clicks outside both profile wrappers
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {

    if (!this.isProfileMenuOpen) {
      return;
    }

    const target = event.target as Node;

    const clickedInside = this.customerProfiles?.some(profile =>
      profile.nativeElement.contains(target)
    );

    if (!clickedInside) {
      this.closeProfileMenu();
    }
  }

  // Close dropdown using Escape
  @HostListener('document:keydown.escape')
  onEscapeKey(): void {
    this.closeProfileMenu();
    this.closeMobileMenu();
  }

  // --------------------------------
  // Customer Navigation
  // --------------------------------

  openProfile(): void {
    this.closeProfileMenu();
    this.closeMobileMenu();

    this.router.navigate(['/profile']);
  }

  openOrders(): void {
    this.closeProfileMenu();
    this.closeMobileMenu();

    this.router.navigate(['/my-orders']);
  }

  // --------------------------------
  // Logout
  // --------------------------------

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
}
