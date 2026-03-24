import { Component, OnInit } from '@angular/core';
import { AuthService } from 'src/app/auth/auth.service';
import { BikesService, FavoriteBike, Inquiry } from 'src/app/core/services/bikes.service';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-buyer-dashboard',
  templateUrl: './buyer-dashboard.component.html',
  styleUrls: ['./buyer-dashboard.component.css'],
})
export class BuyerDashboardComponent implements OnInit {
  buyerName = 'Buyer';
  buyerEmail = '';
  favoriteBikes: FavoriteBike[] = [];
  inquiries: Inquiry[] = [];
  isLoadingFavorites = true;
  isLoadingInquiries = true;
  removingId: number | null = null;
  apiBase = environment.apiUrl.replace('/api', '');

  constructor(private auth: AuthService, private bikesService: BikesService) {}

  ngOnInit(): void {
    this.auth.getMe().subscribe({
      next: (user) => {
        this.buyerName = user.name || 'Buyer';
        this.buyerEmail = user.email;
      },
      error: () => {
        this.buyerName = 'Buyer';
        this.buyerEmail = '';
      },
    });

    this.loadFavorites();
    this.loadInquiries();
  }

  loadInquiries(): void {
    this.isLoadingInquiries = true;
    this.bikesService.getInquiries().subscribe({
      next: (data) => {
        this.inquiries = data;
        this.isLoadingInquiries = false;
      },
      error: (err) => {
        console.error('Could not load inquiries', err);
        this.isLoadingInquiries = false;
      }
    });
  }

  getStatusClasses(status: string): string {
    switch (status?.toLowerCase()) {
      case 'approved': return 'bg-green-500/10 text-green-600 dark:text-green-400';
      case 'rejected': return 'bg-red-500/10 text-primary';
      default:         return 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400';
    }
  }

  getStatusDotClass(status: string): string {
    switch (status?.toLowerCase()) {
      case 'approved': return 'bg-green-500';
      case 'rejected': return 'bg-primary';
      default:         return 'bg-yellow-500';
    }
  }

  loadFavorites(): void {
    this.isLoadingFavorites = true;
    this.bikesService.getFavorites().subscribe({
      next: (bikes) => {
        this.favoriteBikes = bikes;
        this.isLoadingFavorites = false;
      },
      error: (err) => {
        console.error('Could not load favorites', err);
        this.isLoadingFavorites = false;
      }
    });
  }

  toggleFavorite(bikeId: number): void {
    this.removingId = bikeId;
    this.bikesService.toggleFavorite(bikeId).subscribe({
      next: () => {
        this.favoriteBikes = this.favoriteBikes.filter(b => b.id !== bikeId);
        this.removingId = null;
      },
      error: (err) => {
        console.error('Could not toggle favorite', err);
        this.removingId = null;
      }
    });
  }

  getImageUrl(imageUrl: string | undefined): string {
    if (!imageUrl) return '';
    if (imageUrl.startsWith('http')) return imageUrl;
    return `${this.apiBase}${imageUrl}`;
  }

  logout(): void {
    this.auth.logout();
  }
}
