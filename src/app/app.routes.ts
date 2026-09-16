import { Routes } from '@angular/router';
import { LoginComponent } from './login.component';
import { AuthCallbackComponent } from './auth-callback.component';
import { HomeComponent } from './home.component';
import { AuthGuard } from './auth.guard';
import { RoleGuard } from './role.guard';
import { ActiveProcessesComponent } from './active-processes/active-processes.component';
import { StudentTasksComponent } from './student-tasks/student-tasks.component';
import { MojiIzvestajiComponent } from './reports/moji-izvestaji.component';
import { StudentReportComponent } from './reports/student-report.component';
import { TaskDetailComponent } from './task-detail/task-detail.component';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'aktivni-predmeti', component: ActiveProcessesComponent, canActivate: [AuthGuard, RoleGuard], data: { allowedRoles: ['admin', 'teacher'] } },
  { path: 'moji-zadaci', component: StudentTasksComponent, canActivate: [AuthGuard, RoleGuard], data: { allowedRoles: ['student'] } },
  { path: 'moji-izvestaji-zadaci', component: StudentReportComponent, canActivate: [AuthGuard, RoleGuard], data: { allowedRoles: ['student'] } },
  { path: '', component: HomeComponent, canActivate: [AuthGuard], pathMatch: 'full' },

  { path: 'moji-izvestaji', component: MojiIzvestajiComponent, canActivate: [AuthGuard] },
  { path: 'task/:id', component: TaskDetailComponent, canActivate: [AuthGuard] },
];