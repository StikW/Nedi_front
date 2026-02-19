import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterTestingModule } from '@angular/router/testing';
import { ProfileComponent } from './profile.component';
import { AuthService } from '../../core/services/auth.service';
import { of } from 'rxjs';

describe('ProfileComponent', () => {
  let component: ProfileComponent;
  let fixture: ComponentFixture<ProfileComponent>;
  let authService: jasmine.SpyObj<AuthService>;

  beforeEach(async () => {
    const authServiceSpy = jasmine.createSpyObj('AuthService', [], {
      currentUser$: of({
        id: 1,
        email: 'test@example.com',
        name: 'Test User',
        role: 'instructor',
        phone: '+1234567890',
        company: 'Test Company',
        position: 'Test Position',
        bio: 'Test bio'
      })
    });

    await TestBed.configureTestingModule({
      imports: [ProfileComponent, ReactiveFormsModule, RouterTestingModule],
      providers: [
        { provide: AuthService, useValue: authServiceSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ProfileComponent);
    component = fixture.componentInstance;
    authService = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize form with user data', () => {
    expect(component.profileForm.get('name')?.value).toBe('Test User');
    expect(component.profileForm.get('email')?.value).toBe('test@example.com');
  });

  it('should toggle edit mode', () => {
    expect(component.isEditing).toBeFalse();
    component.toggleEdit();
    expect(component.isEditing).toBeTrue();
    component.toggleEdit();
    expect(component.isEditing).toBeFalse();
  });
});
