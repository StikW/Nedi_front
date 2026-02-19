import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { take } from 'rxjs/operators';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="loading-container">
      <div class="loading-spinner"></div>
      <p>Redirigiendo...</p>
    </div>
  `,
  styles: [`
    .loading-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100vh;
      background: linear-gradient(135deg, #f0f4ff 0%, #f5f3ff 100%);
    }
    
    .loading-spinner {
      width: 40px;
      height: 40px;
      border: 4px solid #e2e8f0;
      border-top: 4px solid #2563eb;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin-bottom: 1rem;
    }
    
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
    
    p {
      color: #64748b;
      font-size: 1.1rem;
      margin: 0;
    }
  `]
})
export class HomeComponent implements OnInit {
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.checkAuthAndRedirect();
  }

  private checkAuthAndRedirect(): void {
    this.authService.currentUser$.pipe(take(1)).subscribe(user => {
      if (user) {
        // Usuario autenticado - redirigir al dashboard del instructor
        this.router.navigate(['/instructor']);
      } else {
        // Usuario no autenticado - redirigir al login
        this.router.navigate(['/login']);
      }
    });
  }
} 