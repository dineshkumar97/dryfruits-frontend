
import { Component, HostListener, OnDestroy, OnInit } from '@angular/core';
import {
  Router,
  RouterOutlet,
  RouterLink,
  RouterLinkActive,
  NavigationEnd
} from '@angular/router';

import { filter, Subscription } from 'rxjs';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive
  ],
  templateUrl: './admin-layout.html',
  styleUrl: './admin-layout.scss'
})
export class AdminLayout implements OnInit, OnDestroy {

  // Sidebar
  isSidebarOpen = false;

  // Profile dropdown
  isProfileMenuOpen = false;

  // Login page detection
  isLoginPage = false;

  // Admin details
  adminName = 'Administrator';
  adminEmail = 'RATASREE. Store';
  adminInitial = 'A';

  private routerSubscription?: Subscription;

  constructor(private router: Router) {}

  ngOnInit(): void {

    this.checkCurrentRoute();

    this.loadAdminDetails();

    this.routerSubscription = this.router.events
      .pipe(
        filter(event => event instanceof NavigationEnd)
      )
      .subscribe(() => {

        this.checkCurrentRoute();

        this.loadAdminDetails();

      });

  }

  // =====================================
  // ROUTE CHECK
  // =====================================

  private checkCurrentRoute(): void {

    const currentUrl = this.router.url.split('?')[0];

    this.isLoginPage = currentUrl === '/admin-login';

    this.closeSidebar();

    this.closeProfileMenu();

  }

  // =====================================
  // LOAD ADMIN DETAILS
  // =====================================

  private loadAdminDetails(): void {

    try {

      const userData = localStorage.getItem('nutnest-user');

      if (!userData) {

        this.resetAdminDetails();

        return;

      }

      const user = JSON.parse(userData);

      this.adminName = user.name || 'Administrator';

      this.adminEmail = user.email || 'RATASREE. Store';

      this.adminInitial = this.adminName
        .charAt(0)
        .toUpperCase();

    } catch (error) {

      console.error('Unable to load admin details:', error);

      this.resetAdminDetails();

    }

  }

  // =====================================
  // RESET ADMIN DETAILS
  // =====================================

  private resetAdminDetails(): void {

    this.adminName = 'Administrator';

    this.adminEmail = 'RATASREE. Store';

    this.adminInitial = 'A';

  }

  // =====================================
  // SIDEBAR
  // =====================================

  toggleSidebar(): void {

    this.isSidebarOpen = !this.isSidebarOpen;

    this.closeProfileMenu();

  }

  closeSidebar(): void {

    this.isSidebarOpen = false;

  }

  // =====================================
  // PROFILE DROPDOWN
  // =====================================

  toggleProfileMenu(): void {

    this.isProfileMenuOpen = !this.isProfileMenuOpen;

  }

  closeProfileMenu(): void {

    this.isProfileMenuOpen = false;

  }

  // =====================================
  // OPEN PROFILE
  // =====================================

  openProfile(): void {

    this.closeProfileMenu();

    this.router.navigate(['/admin/profile']);

  }

  // =====================================
  // LOGOUT
  // =====================================
isScrolled = false;

@HostListener('window:scroll')
onWindowScroll(): void {
  this.isScrolled = window.scrollY > 30;
}
  logout(): void {

    this.closeProfileMenu();

    this.closeSidebar();

    // Remove authentication details
    localStorage.removeItem('nutnest-access-token');

    localStorage.removeItem('nutnest-user');

    // Reset profile information
    this.resetAdminDetails();

    // Redirect to admin login
    this.router.navigate(['/admin-login'], {
      replaceUrl: true
    });

  }

  // =====================================
  // DESTROY SUBSCRIPTION
  // =====================================

  ngOnDestroy(): void {

    this.routerSubscription?.unsubscribe();

  }

}
