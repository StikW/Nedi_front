import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/services/auth.service';
import { User } from '../../models/user.model';

@Component({
  selector: 'app-meta-settings',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './meta-settings.component.html',
  styleUrls: ['./meta-shared.css'],
})
export class MetaSettingsComponent {
  user: User | null;

  constructor(private authService: AuthService) {
    this.user = this.authService.getCurrentUser();
  }
}
