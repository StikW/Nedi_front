import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavbarComponent } from '../../../components/navbar/navbar.component';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, NavbarComponent, FormsModule, RouterLink],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css']
})
export class RegisterComponent {
  fullName: string = '';
  email: string = '';
  password: string = '';
  confirmPassword: string = '';
  acceptTerms: boolean = false;

  onSubmit() {
    // TODO: Implement register logic
    console.log('Register form submitted', {
      fullName: this.fullName,
      email: this.email,
      password: this.password,
      confirmPassword: this.confirmPassword,
      acceptTerms: this.acceptTerms
    });
  }
} 