import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Router } from '@angular/router';

const CREDENTIALS_KEY = 'basic_auth_credentials';

export interface StoredCredentials {
  username: string;
  password: string;
  role: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  constructor(private router: Router) {}

  
  validateAndLogin(username: string, password: string, roleHint?: string): Observable<true> {
    const encoded = btoa(`${username}:${password}`);
    const headers = { Authorization: `Basic ${encoded}` };
    const opts = { credentials: 'omit' as const, headers };

    return new Observable<true>(observer => {
      if (roleHint === 'admin' || roleHint === 'teacher') {
        fetch('/process-instance/list?page=0&size=1&sortBy=modifiedTime&sortDir=DESC', opts)
          .then(res => {
            if (res.status === 401) { observer.error(new Error('Pogrešno korisničko ime ili lozinka.')); return; }
            if (res.ok) { this.storeCredentials(username, password, roleHint); observer.next(true); observer.complete(); return; }
            observer.error(new Error('Vaša uloga nije podržana u ovoj aplikaciji.'));
          }).catch(() => observer.error(new Error('Ne može se uspostaviti veza sa serverom.')));
        return;
      }
      if (roleHint === 'student') {
        fetch('/task/list?page=0&size=1', opts)
          .then(res => {
            if (res.status === 401) { observer.error(new Error('Pogrešno korisničko ime ili lozinka.')); return; }
            if (res.ok) { this.storeCredentials(username, password, 'student'); observer.next(true); observer.complete(); return; }
            observer.error(new Error('Vaša uloga nije podržana u ovoj aplikaciji.'));
          }).catch(() => observer.error(new Error('Ne može se uspostaviti veza sa serverom.')));
        return;
      }
      Promise.all([
        fetch('/process-instance/list?page=0&size=1&sortBy=modifiedTime&sortDir=DESC', opts),
        fetch('/task/list?page=0&size=1', opts)
      ]).then(async ([processRes, taskRes]) => {
        if (processRes.status === 401 && taskRes.status === 401) {
          observer.error(new Error('Pogrešno korisničko ime ili lozinka.'));
          return;
        }

        if (taskRes.ok && !processRes.ok) {
          this.storeCredentials(username, password, 'student');
          observer.next(true);
          observer.complete();
          return;
        }

        if (processRes.ok) {
          let role = 'teacher';
          try {
            const usersRes = await fetch('/api/users', opts);
            if (usersRes.ok) {
              const users = await usersRes.json() as any[];
              const currentUser = users.find(user =>
                user.username === username || user.userId === username || user.id === username
              );
              const roles = this.normalizeRoles(currentUser);
              if (roles.includes('admin')) role = 'admin';
              else if (roles.includes('student')) role = 'student';
            }
          } catch {
          }

          this.storeCredentials(username, password, role);
          observer.next(true);
          observer.complete();
          return;
        }

        observer.error(new Error('Vaša uloga nije podržana u ovoj aplikaciji.'));
      }).catch(() => observer.error(new Error('Ne može se uspostaviti veza sa serverom.')));
    });
  }

  private normalizeRoles(user: any): string[] {
    const roles = Array.isArray(user?.roles) ? user.roles : [user?.role];
    return roles
      .map((role: any) => typeof role === 'string' ? role : role?.name)
      .filter((role: any): role is string => !!role)
      .map((role: string) => role.toLowerCase());
  }

  private storeCredentials(username: string, password: string, role: string): void {
    const credentials: StoredCredentials = { username, password, role };
    localStorage.setItem(CREDENTIALS_KEY, JSON.stringify(credentials));
  }

  logout(): void {
    localStorage.removeItem(CREDENTIALS_KEY);
    this.router.navigate(['/login']);
  }

  get isLoggedIn(): boolean {
    return !!this.getStoredCredentials();
  }

  getAuthHeader(): string | null {
    const creds = this.getStoredCredentials();
    if (!creds) return null;
    const encoded = btoa(`${creds.username}:${creds.password}`);
    return `Basic ${encoded}`;
  }

  getUsername(): string {
    return this.getStoredCredentials()?.username ?? '';
  }

  getRoles(): string[] {
    const role = this.getStoredCredentials()?.role;
    return role ? [role] : [];
  }

  hasRole(role: string): boolean {
    return this.getRoles().includes(role);
  }

  isAdmin(): boolean {
    return this.hasRole('admin');
  }

  isTeacher(): boolean {
    return this.hasRole('teacher');
  }

  isProfessor(): boolean {
    return this.hasRole('admin') || this.hasRole('teacher');
  }

  isStudent(): boolean {
    return this.hasRole('student');
  }

  private getStoredCredentials(): StoredCredentials | null {
    const raw = localStorage.getItem(CREDENTIALS_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as StoredCredentials;
    } catch {
      return null;
    }
  }
}