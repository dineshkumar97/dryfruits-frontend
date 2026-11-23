import { Routes } from '@angular/router';

export const routes: Routes = [
  // Customer website
  {
    path: '',
    loadComponent: () =>
      import('./customer/layouts/store-layout/store-layout')
        .then(m => m.StoreLayout),

    children: [
      {
        path: 'home',
        loadComponent: () =>
          import('./customer/pages/home/home')
            .then(m => m.Home)
      },
      {
        path: 'products',
        loadComponent: () =>
          import('./customer/pages/products/products')
            .then(m => m.Products)
      },
      {
        path: 'product-details/:id',
        loadComponent: () =>
          import('./customer/pages/product-details/product-details')
            .then(m => m.ProductDetails)
      },
      {
        path: 'cart',
        loadComponent: () =>
          import('./customer/pages/cart/cart')
            .then(m => m.Cart)
      },
      {
        path: 'checkout',
        loadComponent: () =>
          import('./customer/pages/checkout/checkout')
            .then(m => m.Checkout)
      },
      {
        path: 'order-success',
        loadComponent: () =>
          import('./customer/pages/order-success/order-success')
            .then(m => m.OrderSuccess)
      },
      {
        path: 'my-orders',
        loadComponent: () =>
          import('./customer/pages/my-orders/my-orders')
            .then(m => m.MyOrders)
      },
      {
        path: 'track-order',
        loadComponent: () =>
          import('./customer/pages/track-order/track-order')
            .then(m => m.TrackOrder)
      },
      {
        path: 'wishlist',
        loadComponent: () =>
          import('./customer/pages/wishlist/wishlist')
            .then(m => m.Wishlist)
      },
      {
        path: 'about',
        loadComponent: () =>
          import('./customer/pages/about/about')
            .then(m => m.About)
      },
      {
        path: 'contact',
        loadComponent: () =>
          import('./customer/pages/contact/contact')
            .then(m => m.Contact)
      }, {
        path: 'privacy-policy',
        loadComponent: () =>
          import('./customer/pages/privacy-policy/privacy-policy')
            .then(m => m.PrivacyPolicy)
      }, {
        path: 'terms-conditions',
        loadComponent: () =>
          import('./customer/pages/terms-conditions/terms-conditions')
            .then(m => m.TermsConditions)
      }, {
        path: 'refund-policy',
        loadComponent: () =>
          import('./customer/pages/refund-policy/refund-policy')
            .then(m => m.RefundPolicy)
      }
    ]
  },

  // Admin dashboard
  {
    path: 'admin',
    loadComponent: () =>
      import('./admin/layouts/admin-layout/admin-layout')
        .then(m => m.AdminLayout),

    children: [
      {
        path: '',
        loadComponent: () =>
          import('./admin/pages/dashboard/dashboard')
            .then(m => m.Dashboard)
      }
    ]
  },

  // Invalid routes
  {
    path: '**',
    redirectTo: ''
  }
];