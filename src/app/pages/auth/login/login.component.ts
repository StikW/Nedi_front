import { Component, HostListener, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { AuthService } from '../../../core/services/auth.service';
import { getDefaultRouteForRole } from '../../../core/utils/role-routes';

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
  showLoginModal: boolean = false;
  serverError: string = '';
  private returnUrl: string = '/courses';
  private destroy$ = new Subject<void>();

  constructor(
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit() {
    this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/instructor';
    if (
      this.route.snapshot.queryParams['login'] === 'true' ||
      this.route.snapshot.queryParams['returnUrl']
    ) {
      this.showLoginModal = true;
    }
  }

  openLogin(): void {
    this.showLoginModal = true;
  }

  closeLogin(): void {
    if (this.isLoading) return;
    this.showLoginModal = false;
    this.serverError = '';
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.closeLogin();
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
        next: (user) => {
          const defaultRoute = getDefaultRouteForRole(user.role);
          const target = this.returnUrl.startsWith(defaultRoute) ? this.returnUrl : defaultRoute;
          this.router.navigateByUrl(target);
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