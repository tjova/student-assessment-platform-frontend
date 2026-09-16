import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { StudentTaskService } from '../student-tasks/student-task.service';
import { translateTaskName } from '../task-name-translations';
import { translateStatus } from '../status-translations';

@Component({
  selector: 'app-task-detail',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './task-detail.component.html',
  styleUrls: ['./task-detail.component.css']
})
export class TaskDetailComponent implements OnInit {
  taskId: string | null = null;
  taskHistory: any = null;
  isLoading = false;
  error: string | null = null;
  translateTaskName = translateTaskName;
  translateStatus = translateStatus;

  constructor(
    private route: ActivatedRoute,
    private studentTaskService: StudentTaskService,
    private cdr: ChangeDetectorRef,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.taskId = this.route.snapshot.paramMap.get('id');
    if (!this.taskId) {
      this.error = 'Nije pronađen ID zadatka.';
      return;
    }

    this.fetchTask(this.taskId);
  }

  fetchTask(id: string) {
    this.isLoading = true;
    this.error = null;
    this.studentTaskService.getTaskHistory(id).subscribe({
      next: (res: any) => {
        this.taskHistory = res;
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        console.error('Error fetching task:', err);
        this.error = 'Greška pri učitavanju zadatka.';
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  back() {
    this.router.navigateByUrl('/');
  }
}
