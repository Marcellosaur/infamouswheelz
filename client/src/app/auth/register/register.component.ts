import { Component } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { AuthService } from '../auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css']
})
export class RegisterComponent {
  // Single source of truth for auth mode
  authMode: 'login' | 'register' = 'register';
  form = this.fb.nonNullable.group({
    name: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
    confirmPassword: ['', Validators.required],
    role: ['buyer' as 'buyer' | 'seller', Validators.required],
    terms: [false, Validators.requiredTrue]
  });

  constructor(private fb: FormBuilder, private auth: AuthService, private router: Router) { }

  // Update validators when toggling auth mode
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

    // Avoid leaking validation state between modes
    name?.updateValueAndValidity({ emitEvent: false });
    confirmPassword?.updateValueAndValidity({ emitEvent: false });
    role?.updateValueAndValidity({ emitEvent: false });
    terms?.updateValueAndValidity({ emitEvent: false });
    name?.setErrors(null);
    confirmPassword?.setErrors(null);
    role?.setErrors(null);
    terms?.setErrors(null);
    this.form.setErrors(null);
  }

  submit() {
    if (this.form.invalid) return;

    const { name, email, password, confirmPassword, role } = this.form.getRawValue();
    if (this.authMode === 'register' && password !== confirmPassword) {
      this.form.get('confirmPassword')?.setErrors({ mismatch: true });
      return;
    }

    if (this.authMode === 'login') {
      this.auth.login({ email, password }).subscribe({
        next: () => {
          const role = this.auth.getUserRole();
          const target = role === 'seller'
            ? '/seller-dashboard'
            : role === 'buyer'
              ? '/buyer-dashboard'
              : '/';
          this.router.navigate([target]);
        },
        error: (err) => console.error(err)
      });
      return;
    }

    const target = role === 'seller' ? '/seller-dashboard' : '/buyer-dashboard';
    this.auth.register({ name, email, password, role }).subscribe({
      next: () => this.router.navigate([target]),
      error: (err) => console.error(err)
    });
  }

  modalOpen = false;
  modalType: 'terms' | 'privacy' = 'terms';

  openModal(type: 'terms' | 'privacy') {
    this.modalType = type;
    this.modalOpen = true;
  }
  
}
