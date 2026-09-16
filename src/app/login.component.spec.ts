import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { Router } from '@angular/router';
import { vi, type Mocked } from 'vitest';
import { LoginComponent } from './login.component';
import { AuthService } from './auth.service';

describe('LoginComponent', () => {
  let fixture: ComponentFixture<LoginComponent>;
  let authService: Mocked<AuthService>;
  let router: Mocked<Router>;

  beforeEach(async () => {
    authService = {
      validateAndLogin: vi.fn(),
      isProfessor: vi.fn(),
      isStudent: vi.fn()
    } as unknown as Mocked<AuthService>;
    router = { navigate: vi.fn() } as unknown as Mocked<Router>;
    authService.validateAndLogin.mockReturnValue(of(true));

    await TestBed.configureTestingModule({
      imports: [LoginComponent],
      providers: [
        { provide: AuthService, useValue: authService },
        { provide: Router, useValue: router }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(LoginComponent);
  });

  it('should auto-detect the user role during login without requiring a manual selection', () => {
    fixture.componentInstance.username = 'student1';
    fixture.componentInstance.password = 'pass123';

    fixture.componentInstance.login();

    expect(authService.validateAndLogin).toHaveBeenCalledWith('student1', 'pass123');
  });
});
