import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from './auth.service';


@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
  standalone: true,
  imports: [CommonModule, FormsModule]
})
export class LoginComponent {
  username = '';
  password = '';
  errorMessage = '';
  loading = false;

  constructor(private authService: AuthService, private router: Router) {}

  login(): void {
    if (!this.username || !this.password) {
      this.errorMessage = 'Unesite korisničko ime i lozinku.';
      return;
    }
    this.errorMessage = '';
    this.loading = true;

    this.authService.validateAndLogin(this.username, this.password).subscribe({
      next: () => {
        this.loading = false;
        if (this.authService.isProfessor()) {
          this.router.navigate(['/aktivni-predmeti']);
        } else if (this.authService.isStudent()) {
          this.router.navigate(['/moji-zadaci']);
        } else {
          this.router.navigate(['/']);
        }
      },
      error: (err: Error) => {
        this.loading = false;
        this.errorMessage = err.message;
      }
    });
  }
}