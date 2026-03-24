import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { BikesService, Bike, Seller } from 'src/app/core/services/bikes.service';

import { AuthService } from 'src/app/auth/auth.service';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-bike-details',
  templateUrl: './bike-details.component.html',
  styleUrls: ['./bike-details.component.css']
})
export class BikeDetailsComponent implements OnInit {
  bike?: Bike;
  seller?: Seller;
  isFavorited = false;
  isToggling = false;
  isLoggedIn = this.authService.isAuthenticated();
  
  // Inquiry Modal State
  showInquiryModal = false;
  inquiryStatus: 'idle' | 'sending' | 'success' | 'error' = 'idle';
  inquiryErrorMessage = '';

  private apiBase = environment.apiUrl.replace(/\/api\/?$/, '');


  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private bikesService: BikesService,
    private authService: AuthService
  ) { }

  ngOnInit() {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (!Number.isFinite(id)) return;

    this.bikesService.getById(id).subscribe((bike) => {
      this.bike = bike;

      // Load seller info
      if (bike.seller_id) {
        this.bikesService.getSellerById(bike.seller_id).subscribe({
          next: (seller) => { this.seller = seller; },
          error: () => {}
        });
      }

      // Once the bike is loaded, check if it's already in the user's favorites
      if (this.authService.isAuthenticated()) {
        this.bikesService.getFavorites().subscribe({
          next: (favs) => {
            this.isFavorited = favs.some(f => f.id === bike.id);
          },
          error: () => {}
        });
      }
    });
  }

  goToDashboard(): void {
    const role = this.authService.getUserRole();
    if (role === 'admin') {
      this.router.navigate(['/admin-dashboard']);
    } else if (role === 'seller') {
      this.router.navigate(['/seller-dashboard']);
    } else {
      this.router.navigate(['/buyer-dashboard']);
    }
  }

  toggleFavorite(): void {
    if (!this.bike) return;

    if (!this.authService.isAuthenticated()) {
      this.router.navigate(['/login']);
      return;
    }

    this.isToggling = true;
    this.bikesService.toggleFavorite(this.bike.id).subscribe({
      next: (res) => {
        this.isFavorited = res.favorited;
        this.isToggling = false;
      },
      error: (err) => {
        console.error('Could not toggle favorite', err);
        this.isToggling = false;
      }
    });
  }

  openInquiryModal(): void {
    if (!this.authService.isAuthenticated()) {
      this.router.navigate(['/login']);
      return;
    }
    this.showInquiryModal = true;
    this.inquiryStatus = 'idle';
  }

  closeInquiryModal(): void {
    this.showInquiryModal = false;
  }

  sendInquiry(message: string): void {
    if (!message || message.trim().length === 0) return;
    if (!this.bike) return;

    this.inquiryStatus = 'sending';
    this.bikesService.postInquiry(this.bike.id, message).subscribe({
      next: () => {
        this.inquiryStatus = 'success';
        setTimeout(() => this.closeInquiryModal(), 2500);
      },
      error: (err) => {
        this.inquiryStatus = 'error';
        this.inquiryErrorMessage = err.error?.error || 'Failed to send inquiry.';
      }
    });
  }

  // Normalize image URLs coming from the API.
  resolveImageUrl(bike: Bike): string {
    const url = bike.image_url;
    if (!url) {
      return 'assets/images/Superleggera.jpg';
    }
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }
    if (url.startsWith('/')) {
      return `${this.apiBase}${url}`;
    }
    return url;
  }

  memberSince(dateStr: string): string {
    return new Date(dateStr).getFullYear().toString();
  }
}
