import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { trigger, transition, style, animate } from '@angular/animations';
import { BikesService, Bike } from 'src/app/core/services/bikes.service';
import { AuthService } from 'src/app/auth/auth.service';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css'],
  animations: [
    trigger('slideIn', [
      transition(':enter', [
        style({ transform: 'translateX(-100%)', opacity: 0 }),
        animate(
          '600ms 400ms ease-out',
          style({ transform: 'translateX(0)', opacity: 1 })
        ),
      ]),
    ]),
  ],
})
export class HomeComponent implements OnInit {
  bikes: Bike[] = [];
  favoriteIds = new Set<number>();
  togglingId: number | null = null;
  isLoggedIn = this.authService.isAuthenticated();
  private apiBase = environment.apiUrl.replace(/\/api\/?$/, '');

  constructor(
    private bikesService: BikesService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.bikesService.getAll().subscribe({
      next: (data) => (this.bikes = data),
      error: (err) => console.error(err)
    });

    // Pre-load existing favorites so hearts show filled for saved bikes
    if (this.authService.isAuthenticated()) {
      this.bikesService.getFavorites().subscribe({
        next: (favs) => favs.forEach(f => this.favoriteIds.add(f.id)),
        error: () => {} // silently ignore — user may not be a buyer
      });
    }
  }

  toggleFavorite(bikeId: number, event: MouseEvent): void {
    event.stopPropagation();

    if (!this.authService.isAuthenticated()) {
      this.router.navigate(['/login']);
      return;
    }

    this.togglingId = bikeId;
    this.bikesService.toggleFavorite(bikeId).subscribe({
      next: (res) => {
        if (res.favorited) {
          this.favoriteIds.add(bikeId);
        } else {
          this.favoriteIds.delete(bikeId);
        }
        this.togglingId = null;
      },
      error: (err) => {
        console.error('Could not toggle favorite', err);
        this.togglingId = null;
      }
    });
  }

  isFavorited(bikeId: number): boolean {
    return this.favoriteIds.has(bikeId);
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
}
