import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { AuthService } from './auth.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
  standalone: true,
  imports: [CommonModule, RouterLink]
})
export class HomeComponent implements OnInit {
  isProfessor: boolean = false;
  isStudent: boolean = false;
  userRoles: string[] = [];

  constructor(private authService: AuthService, private router: Router) {}

  ngOnInit(): void {
    this.isProfessor = this.authService.isProfessor();
    this.isStudent = this.authService.isStudent();
    this.userRoles = this.authService.getRoles();
    
    console.log('User roles:', this.userRoles);
    console.log('Is Professor:', this.isProfessor);
    console.log('Is Student:', this.isStudent);
    if (this.isStudent) {
      console.log('Redirecting to moji-zadaci');
      this.router.navigate(['/moji-zadaci']);
    } else if (this.isProfessor) {
      console.log('Redirecting to aktivni-predmeti');
      this.router.navigate(['/aktivni-predmeti']);
    }
  }

  logout(): void {
    this.authService.logout();
  }

  get isLoggedIn(): boolean {
    return this.authService.isLoggedIn;
  }
}