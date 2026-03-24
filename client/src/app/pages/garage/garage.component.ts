import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { BikesService, Bike } from 'src/app/core/services/bikes.service';
import { AuthService } from 'src/app/auth/auth.service';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-garage',
  templateUrl: './garage.component.html',
  styleUrls: ['./garage.component.css'],
})
export class GarageComponent implements OnInit {
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

  showNew = true;
  showUsed = true;

  minPrice = 2000;
  maxPrice = 200000;

  engineFilter: 'under-300' | '300-600' | '600-1000' | '1000-plus' | '' = '';

  pageSize = 9;
  currentPage = 1;

  private matchesEngineFilter(bike: Bike): boolean {
    if (!this.engineFilter) return true;
    const match = bike.engine_size?.match(/\d+/);
    if (!match) return true;
    const cc = Number(match[0]);
    switch (this.engineFilter) {
      case 'under-300':
        return cc < 300;
      case '300-600':
        return cc >= 300 && cc <= 600;
      case '600-1000':
        return cc > 600 && cc <= 1000;
      case '1000-plus':
        return cc > 1000;
      default:
        return true;
    }
  }

  get filteredBikes(): Bike[] {
    return this.bikes.filter((bike) => this.matchesEngineFilter(bike));
  }

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.filteredBikes.length / this.pageSize));
  }

  get pagedBikes(): Bike[] {
    const list = this.filteredBikes;
    const start = (this.currentPage - 1) * this.pageSize;
    return list.slice(start, start + this.pageSize);
  }

  get pages(): number[] {
    const total = this.totalPages;
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  onEngineFilterChange(): void {
    this.currentPage = 1;
  }

  clearEngineFilter(): void {
    this.engineFilter = '';
    this.onEngineFilterChange();
  }

  setPage(page: number): void {
    if (page < 1 || page > this.totalPages) return;
    this.currentPage = page;
  }

  nextPage(): void {
    this.setPage(this.currentPage + 1);
  }

  prevPage(): void {
    this.setPage(this.currentPage - 1);
  }

  fetchBikes(): void {
    const conditions = [
      ...(this.showNew ? ['New'] : []),
      ...(this.showUsed ? ['Used'] : []),
    ];
    this.bikesService.getAll(conditions).subscribe({
      next: (data) => (this.bikes = data),
      error: (err) => console.error(err),
    });

    this.bikesService
      .getAllWithFilters({
        minPrice: this.minPrice,
        maxPrice: this.maxPrice,
        conditions: [
          ...(this.showNew ? ['New'] : []),
          ...(this.showUsed ? ['Used'] : []),
        ],
      })
      .subscribe({
        next: (data) => {
          this.bikes = data;
          this.currentPage = 1;
        },
        error: (err) => console.error(err),
      });
  }

  ngOnInit() {
    this.fetchBikes();

    // Pre-load favorite IDs so hearts show filled for already-saved bikes
    if (this.authService.isAuthenticated()) {
      this.bikesService.getFavorites().subscribe({
        next: (favs) => favs.forEach(f => this.favoriteIds.add(f.id)),
        error: () => {} // silently ignore
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
}
