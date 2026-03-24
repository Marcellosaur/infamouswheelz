import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../auth/auth.service';
import { AdminService, AdminStats, User } from '../../core/services/admin.service';

@Component({
  selector: 'app-admin-dashboard',
  templateUrl: './admin-dashboard.component.html',
  styleUrls: ['./admin-dashboard.component.css']
})
export class AdminDashboardComponent implements OnInit {
  stats: AdminStats | null = null;
  isLoadingStats = true;

  users: User[] = [];
  isLoadingUsers = true;

  adminName = 'Loading...';

  constructor(private auth: AuthService, private adminService: AdminService) { }

  ngOnInit(): void {
    this.auth.getMe().subscribe({
      next: (user) => this.adminName = user.name,
      error: () => this.adminName = 'Admin User'
    });

    this.adminService.getStats().subscribe({
      next: (data) => {
        this.stats = data;
        this.isLoadingStats = false;
      },
      error: (err) => {
        console.error('Failed to load stats', err);
        this.isLoadingStats = false;
      }
    });

    this.adminService.getUsers().subscribe({
      next: (data) => {
        this.users = data;
        this.isLoadingUsers = false;
      },
      error: (err) => {
        console.error('Failed to load users', err);
        this.isLoadingUsers = false;
      }
    });
  }

  toggleUserStatus(user: User): void {
    const newStatus = !user.is_active;
    this.adminService.toggleUserStatus(user.id, newStatus).subscribe({
      next: () => {
        user.is_active = newStatus;
        this.adminService.getStats().subscribe(s => this.stats = s);
      },
      error: (err) => {
        console.error('Failed to toggle user status', err);
      }
    });
  }

  logout() {
    this.auth.logout();
  }
}
