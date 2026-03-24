import { Component, OnInit } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { environment } from 'src/environments/environment';
import { BikesService, Bike, SellerInquiry } from 'src/app/core/services/bikes.service';
import { AuthService } from 'src/app/auth/auth.service';

@Component({
  selector: 'app-seller-dashboard',
  templateUrl: './seller-dashboard.component.html',
  styleUrls: ['./seller-dashboard.component.css'],
})
export class SellerDashboardComponent implements OnInit {
  showCreateModal = false;
  showEditModal = false;
  createError = '';
  editError = '';
  activeTab: 'inventory' | 'inquiries' = 'inventory';
  private api = environment.apiUrl;
  private apiBase = environment.apiUrl.replace(/\/api\/?$/, '');
  bikes: Bike[] = [];
  sellerBikes: Bike[] = [];
  filteredBikes: Bike[] = [];
  pageStart = 1;
  pageSize = 5;
  filterStatus: 'all' | 'available' | 'sold' = 'all';
  sellerName = 'Seller';
  editingBike: Bike | null = null;
  
  // Inquiry State
  inquiries: SellerInquiry[] = [];
  filteredInquiries: SellerInquiry[] = [];
  inquiryFilter: string = 'All';

  form = this.fb.nonNullable.group({
    title: ['', Validators.required],
    brand: ['', Validators.required],
    price: [0, [Validators.required, Validators.min(0)]],
    year: [
      new Date().getFullYear(),
      [Validators.required, Validators.min(1900)],
    ],
    engine_size: [''],
    condition: ['New', Validators.required],
    description: [''],
    imageFile: [null as File | null, Validators.required],
  });

  editForm = this.fb.nonNullable.group({
    title: ['', Validators.required],
    price: [0, [Validators.required, Validators.min(0)]],
    description: [''],
    status: ['Available', Validators.required],
  });

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private router: Router,
    private bikesService: BikesService,
    private authService: AuthService,
  ) {}

  ngOnInit() {
    this.loadSellerName();
    this.loadSellerBikes();
    this.loadInquiries();
  }

  private loadSellerName() {
    this.http
      .get<{ name?: string; email?: string }>(`${this.api}/me`)
      .subscribe({
        next: (user) => {
          this.sellerName = user.name || user.email || 'Seller';
        },
        error: () => {
          this.sellerName = 'Seller';
        },
      });
  }

  private loadSellerBikes() {
    const sellerId = this.getUserIdFromToken();
    this.bikesService.getAll().subscribe({
      next: (data) => {
        this.bikes = data;
        this.sellerBikes = sellerId
          ? data.filter((bike) => bike.seller_id === sellerId)
          : [];
        this.applyFilter();
      },
      error: (err) => console.error(err),
    });
  }

  private loadInquiries() {
    this.bikesService.getSellerInquiries().subscribe({
      next: (data) => {
        this.inquiries = data;
        this.filterInquiries(this.inquiryFilter);
      },
      error: (err) => console.error('Failed to load inquiries:', err)
    });
  }

  setTab(tab: 'inventory' | 'inquiries') {
    this.activeTab = tab;
  }

  setFilter(status: 'all' | 'available' | 'sold') {
    this.filterStatus = status;
    this.applyFilter();
  }

  private applyFilter() {
    if (this.filterStatus === 'available') {
      this.filteredBikes = this.sellerBikes.filter(
        (bike) => bike.status !== 'Sold',
      );
    } else if (this.filterStatus === 'sold') {
      this.filteredBikes = this.sellerBikes.filter(
        (bike) => bike.status === 'Sold',
      );
    } else {
      this.filteredBikes = [...this.sellerBikes];
    }
    this.pageStart = this.filteredBikes.length > 0 ? 1 : 0;
  }

  filterInquiries(status: string) {
    this.inquiryFilter = status;
    if (status === 'All') {
      this.filteredInquiries = [...this.inquiries];
    } else {
      this.filteredInquiries = this.inquiries.filter(i => i.status === status);
    }
  }

  get activeCount(): number {
    return this.sellerBikes.filter((bike) => bike.status !== 'Sold').length;
  }

  get soldCount(): number {
    return this.sellerBikes.filter((bike) => bike.status === 'Sold').length;
  }

  get pageEnd(): number {
    return this.filteredBikes.length === 0
      ? 0
      : Math.min(this.pageSize, this.filteredBikes.length);
  }

  get totalListings(): number {
    return this.filteredBikes.length;
  }

  get pendingInquiriesCount(): number {
    return this.inquiries.filter(i => i.status === 'Pending').length;
  }

  openCreateModal() {
    this.showCreateModal = true;
    this.createError = '';
  }

  closeCreateModal() {
    this.showCreateModal = false;
    this.createError = '';
  }

  openEditModal(bike: Bike) {
    this.editingBike = bike;
    this.editError = '';
    this.editForm.reset({
      title: bike.title || '',
      price: bike.price || 0,
      description: bike.description || '',
      status: bike.status || 'Available',
    });
    this.showEditModal = true;
  }

  closeEditModal() {
    this.showEditModal = false;
    this.editingBike = null;
    this.editError = '';
  }

  submitCreate() {
    this.createError = '';
    if (this.form.invalid) return;

    const { imageFile, ...bikePayload } = this.form.getRawValue();
    if (!imageFile) {
      this.form.get('imageFile')?.setErrors({ required: true });
      return;
    }
    const payload: {
      title: string;
      brand: string;
      price: number;
      year: number;
      engine_size: string;
      condition: string;
      description: string;
      seller_id?: number;
    } = bikePayload;
    const sellerId = this.getUserIdFromToken();
    if (sellerId) {
      payload.seller_id = sellerId;
    }

    const formData = new FormData();
    Object.entries(payload).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        formData.append(key, String(value));
      }
    });
    formData.append('image', imageFile);

    this.http.post<{ id: number }>(`${this.api}/bikes`, formData).subscribe({
      next: (res) => {
        const bikeId = res.id;
        this.closeCreateModal();
        this.loadSellerBikes();
        this.router.navigate(['/bikes', bikeId]);
      },
      error: (err) => {
        this.createError = err?.error?.error || 'Failed to create listing.';
        console.error(err);
      },
    });
  }

  submitEdit() {
    if (!this.editingBike || this.editForm.invalid) return;
    const payload = this.editForm.getRawValue();
    this.http
      .put(`${this.api}/bikes/${this.editingBike.id}`, payload)
      .subscribe({
        next: () => {
          this.closeEditModal();
          this.loadSellerBikes();
        },
        error: (err) => {
          this.editError = err?.error?.error || 'Failed to update listing.';
          console.error(err);
        },
      });
  }

  deleteBike(bike: Bike) {
    const ok = window.confirm(`Delete "${bike.title}"? This cannot be undone.`);
    if (!ok) return;
    this.http.delete(`${this.api}/bikes/${bike.id}`).subscribe({
      next: () => this.loadSellerBikes(),
      error: (err) => console.error(err),
    });
  }

  approveInquiry(id: number) {
    this.updateInquiry(id, 'Approved');
  }

  rejectInquiry(id: number) {
    this.updateInquiry(id, 'Rejected');
  }

  private updateInquiry(id: number, status: 'Approved' | 'Rejected') {
    this.bikesService.updateInquiryStatus(id, status).subscribe({
      next: () => {
        // Optimistically update the ui list
        const match = this.inquiries.find(i => i.id === id);
        if (match) match.status = status;
        this.filterInquiries(this.inquiryFilter);
      },
      error: (err) => console.error('Failed to update inquiry status:', err)
    });
  }

  dateToMonthYear(dateString: string): string {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  }

  getInitials(name: string): string {
    if (!name) return '?';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  }

  onImageSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;
    this.form.patchValue({ imageFile: file });
    this.form.get('imageFile')?.updateValueAndValidity({ emitEvent: false });
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

  // Read seller id from JWT if available.
  private getUserIdFromToken(): number | null {
    const token = localStorage.getItem('auth_token');
    if (!token) return null;
    const parts = token.split('.');
    if (parts.length < 2) return null;
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, '=');
    try {
      const payload = JSON.parse(atob(padded));
      return typeof payload.id === 'number' ? payload.id : null;
    } catch {
      return null;
    }
  }
  
  logout() {
    this.authService.logout();
  }
}
