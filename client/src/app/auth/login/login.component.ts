import { Component } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../auth.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
})
export class LoginComponent {
  // Single source of truth for auth mode
  authMode: 'login' | 'register' = 'login';

  form = this.fb.nonNullable.group({
    name: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
    confirmPassword: ['', Validators.required],
    role: ['buyer' as 'buyer' | 'seller', Validators.required],
    terms: [false, Validators.requiredTrue],
  });

  constructor(
    private fb: FormBuilder,
    private auth: AuthService,
    private router: Router
  ) {}

  setAuthMode(mode: 'login' | 'register') {
    this.authMode = mode;

    const name = this.form.get('name');
    const confirmPassword = this.form.get('confirmPassword');
    const role = this.form.get('role');
    const terms = this.form.get('terms');

    if (mode === 'login') {
      name?.clearValidators();
      confirmPassword?.clearValidators();
      role?.clearValidators();
      terms?.clearValidators();
    } else {
      name?.setValidators([Validators.required]);
      confirmPassword?.setValidators([Validators.required]);
      role?.setValidators([Validators.required]);
      terms?.setValidators([Validators.requiredTrue]);
    }

    // Reset the whole form to clear stale errors and dirty/touched state
    this.form.reset({
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
      role: 'buyer',
      terms: false,
    });
    this.form.markAsPristine();
    this.form.markAsUntouched();
  }

  submit() {
    if (this.authMode === 'login') {
      // Only validate email + password in login mode
      const emailCtrl = this.form.get('email');
      const passwordCtrl = this.form.get('password');
      if (!emailCtrl?.valid || !passwordCtrl?.valid) return;

      const { email, password } = this.form.getRawValue();
      this.auth.login({ email, password }).subscribe({
        next: () => {
          const userRole = this.auth.getUserRole();
          const target =
            userRole === 'admin'
              ? '/admin-dashboard'
              : userRole === 'seller'
              ? '/seller-dashboard'
              : userRole === 'buyer'
              ? '/buyer-dashboard'
              : '/';
          this.router.navigate([target]);
        },
        error: (err) => {
          const msg = err?.error?.error || 'Invalid email or password. Please try again.';
          this.showError(msg);
        },
      });
      return;
    }

    // Register mode — validate full form
    if (this.form.invalid) return;

    const { name, email, password, confirmPassword, role } =
      this.form.getRawValue();

    if (password !== confirmPassword) {
      this.form.get('confirmPassword')?.setErrors({ mismatch: true });
      return;
    }

    const target = role === 'seller' ? '/seller-dashboard' : '/buyer-dashboard';
    this.auth
      .register({ name, email, password, role })
      .subscribe({
        next: () => this.router.navigate([target]),
        error: (err) => console.error('Registration failed:', err),
      });
  }

  modalOpen = false;
  modalType: 'terms' | 'privacy' = 'terms';
  authError: string | null = null;
  private errorTimer: any;

  private showError(msg: string): void {
    this.authError = msg;
    clearTimeout(this.errorTimer);
    this.errorTimer = setTimeout(() => (this.authError = null), 4000);
  }

  openModal(type: 'terms' | 'privacy') {
    this.modalType = type;
    this.modalOpen = true;
  }
}
