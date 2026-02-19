import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { AuthService } from '../../../core/services/auth.service';

interface LoginForm {
  email: string;
  password: string;
}

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnDestroy, OnInit {
  formData: LoginForm = {
    email: '',
    password: ''
  };
  isLoading: boolean = false;
  showPassword: boolean = false;
  serverError: string = '';
  private returnUrl: string = '/courses';
  private destroy$ = new Subject<void>();

  constructor(
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit() {
    // Get return url from route parameters or default to '/instructor'
    this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/instructor';
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onSubmit(form: NgForm) {
    if (form.invalid) {
      // Mark all fields as touched to trigger validation messages
      Object.keys(form.controls).forEach(key => {
        const control = form.controls[key];
        control.markAsTouched();
      });
      return;
    }

    this.isLoading = true;
    this.serverError = '';

    this.authService.login(this.formData.email, this.formData.password)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.router.navigateByUrl(this.returnUrl);
        },
        error: (error) => {
          console.error('Login failed:', error);
          this.serverError = error.message || 'Error al iniciar sesión. Por favor intenta de nuevo.';
          this.isLoading = false;
        }
      });
  }

  togglePassword() {
    this.showPassword = !this.showPassword;
  }
} 