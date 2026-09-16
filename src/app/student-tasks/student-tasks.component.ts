import { Component, OnInit, ChangeDetectorRef, signal, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { StudentTaskService } from './student-task.service';
import { AuthService } from '../auth.service';
import { StudentTask } from './student-task.model';
import { ProcessInstanceService } from '../active-processes/process-instance.service';
import { Router } from '@angular/router';
import { translateTaskName } from '../task-name-translations';
import { translateStatus } from '../status-translations';
import { switchMap } from 'rxjs';

interface TaskWithForm extends StudentTask {
  claimedByCurrentUser?: boolean;
  showForm?: boolean;
  formInput: Record<string, any>;
  isSubmittingForm?: boolean;
  isLoadingHistory?: boolean;
  uploadedFile?: File | null;
}

@Component({
  selector: 'app-student-tasks',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './student-tasks.component.html',
  styleUrls: ['./student-tasks.component.css']
})
export class StudentTasksComponent implements OnInit {
  @Input() showAll: boolean = false; // when true, fetch all tasks (admin/teacher view)
  @Input() initiatorFilter: string | null = null; // when set, fetch only tasks from this user's processes
  assignedTasks: TaskWithForm[] = [];
  isLoading: boolean = true;
  errorMessage: string = '';
  taskPage: number = 0;
  taskPageSize: number = 10;
  taskTotalPages: number = 0;
  taskTotalElements: number = 0;

  selectedTaskHistory = signal<any>(null);
  isLoadingTaskHistory = signal(false);
  selectedTaskAttachmentId = signal<string | null>(null);
  isDownloadingAttachment = signal(false);
  selectedTask = signal<TaskWithForm | null>(null);

  constructor(
    private studentTaskService: StudentTaskService,
    private processService: ProcessInstanceService,
    private cdr: ChangeDetectorRef,
    private router: Router,
    private authService: AuthService
  ) {}

  isStudent: boolean = false;
  isAdmin: boolean = false;
  currentView: 'active' | 'history' = 'active';

  translateTaskName = translateTaskName;
  translateStatus = translateStatus;

  ngOnInit(): void {
    this.isStudent = this.authService.isStudent();
    this.isAdmin = this.authService.isAdmin();
    if (this.authService.isTeacher()) {
      this.fetchTasksByInitiator(0);
    } else if (this.showAll && this.authService.isProfessor()) {
      this.fetchAllTasks(0);
    } else {
      this.fetchAssignedTasks(0);
    }
  }

  fetchAssignedTasks(page: number = 0): void {
    this.isLoading = true;
    this.errorMessage = '';
    const state = this.currentView === 'history' ? 'COMPLETED' : 'ACTIVE';
    this.studentTaskService.getAssignedTasks(page, this.taskPageSize, state).subscribe({
      next: (response: any) => {
        console.log('Assigned tasks API call SUCCESS!', response);

        if (response && response.content) {
          this.assignedTasks = response.content.map((task: StudentTask) => ({
            ...task,
            name: (task as any).taskName || task.name,
            claimedBy: (task as any).assignee || task.claimedBy,
            created: (task as any).startTime || task.created,
            status: ((task as any).state || task.status || '').toString().toLowerCase(),
            claimedByCurrentUser: !!((task as any).assignee || task.claimedBy),
            showForm: false,
            formInput: {},
            uploadedFile: null,
            isSubmittingForm: false
          }));
          console.log('Success! Task Items:', this.assignedTasks.length);
          this.taskTotalPages = response.totalPages || 0;
          this.taskTotalElements = response.totalElements || 0;
          this.taskPage = (typeof response.number === 'number') ? response.number : page;
          this.taskPageSize = response.size || this.taskPageSize;
        } else if (Array.isArray(response)) {
          this.assignedTasks = response.map((task: StudentTask) => ({
            ...task,
            name: (task as any).taskName || task.name,
            claimedBy: (task as any).assignee || task.claimedBy,
            created: (task as any).startTime || task.created,
            status: ((task as any).state || task.status || '').toString().toLowerCase(),
            claimedByCurrentUser: !!((task as any).assignee || task.claimedBy),
            showForm: false,
            formInput: {},
            uploadedFile: null,
            isSubmittingForm: false
          }));
          this.taskTotalPages = 1;
          this.taskTotalElements = this.assignedTasks.length;
          this.taskPage = 0;
        } else {
          console.warn('Unexpected response format:', response);
          this.assignedTasks = [];
        }

        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Assigned tasks API call FAILED:', error);
        this.errorMessage = 'Greška pri učitavanju dodeljenih zadataka.';
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  fetchAllTasks(page: number = 0): void {
    this.isLoading = true;
    this.errorMessage = '';
    this.studentTaskService.getTasks(page, this.taskPageSize, this.currentView === 'history' ? 'COMPLETED' : 'ACTIVE').subscribe({
      next: (response: any) => {
        console.log('All tasks API call SUCCESS!', response);

        if (response && response.content) {
          this.assignedTasks = response.content.map((task: StudentTask) => ({
            ...task,
            name: (task as any).taskName || task.name,
            claimedBy: (task as any).assignee || task.claimedBy,
            created: (task as any).startTime || task.created,
            status: ((task as any).state || task.status || '').toString().toLowerCase(),
            claimedByCurrentUser: !!((task as any).assignee || task.claimedBy),
            showForm: false,
            formInput: {},
            uploadedFile: null,
            isSubmittingForm: false
          }));
          this.taskTotalPages = response.totalPages || 0;
          this.taskTotalElements = response.totalElements || 0;
          this.taskPage = (typeof response.number === 'number') ? response.number : page;
          this.taskPageSize = response.size || this.taskPageSize;
        } else if (Array.isArray(response)) {
          this.assignedTasks = response.map((task: StudentTask) => ({
            ...task,
            name: (task as any).taskName || task.name,
            claimedBy: (task as any).assignee || task.claimedBy,
            created: (task as any).startTime || task.created,
            status: ((task as any).state || task.status || '').toString().toLowerCase(),
            claimedByCurrentUser: !!((task as any).assignee || task.claimedBy),
            showForm: false,
            formInput: {},
            uploadedFile: null,
            isSubmittingForm: false
          }));
          this.taskTotalPages = 1;
          this.taskTotalElements = this.assignedTasks.length;
          this.taskPage = 0;
        } else {
          console.warn('Unexpected response format:', response);
          this.assignedTasks = [];
        }

        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('All tasks API call FAILED:', error);
        this.errorMessage = 'Greška pri učitavanju zadataka.';
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  fetchTasksByInitiator(page: number = 0): void {
    this.isLoading = true;
    this.errorMessage = '';
    const initiatorId = this.initiatorFilter ?? this.authService.getUsername();
    this.studentTaskService.getTasksByInitiator(initiatorId, page, this.taskPageSize, this.currentView === 'history' ? 'COMPLETED' : 'ACTIVE').subscribe({
      next: (response: any) => {
        const mapTask = (task: StudentTask) => ({
          ...task,
          name: (task as any).taskName || task.name,
          claimedBy: (task as any).assignee || task.claimedBy,
          created: (task as any).startTime || task.created,
          status: ((task as any).state || task.status || '').toString().toLowerCase(),
          claimedByCurrentUser: !!((task as any).assignee || task.claimedBy),
          showForm: false,
          formInput: {},
          uploadedFile: null,
          isSubmittingForm: false
        });
        if (response && response.content) {
          this.assignedTasks = response.content.map(mapTask);
          this.taskTotalPages = response.totalPages || 0;
          this.taskTotalElements = response.totalElements || 0;
          this.taskPage = (typeof response.number === 'number') ? response.number : page;
          this.taskPageSize = response.size || this.taskPageSize;
        } else if (Array.isArray(response)) {
          this.assignedTasks = response.map(mapTask);
          this.taskTotalPages = 1;
          this.taskTotalElements = this.assignedTasks.length;
          this.taskPage = 0;
        } else {
          this.assignedTasks = [];
        }
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Tasks by initiator API call FAILED:', error);
        this.errorMessage = 'Greška pri učitavanju zadataka.';
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  goToPage(page: number) {
    if (page < 0 || (this.taskTotalPages && page >= this.taskTotalPages)) return;
    if (this.authService.isTeacher()) {
      this.fetchTasksByInitiator(page);
    } else if (this.showAll && this.authService.isProfessor()) {
      this.fetchAllTasks(page);
    } else {
      this.fetchAssignedTasks(page);
    }
  }

  previousPage() { this.goToPage(this.taskPage - 1); }
  nextPage() { this.goToPage(this.taskPage + 1); }

  goToReports(): void { this.router.navigate(['/moji-izvestaji-zadaci']); }

  switchView(view: 'active' | 'history'): void {
    if (this.currentView === view) return;
    this.currentView = view;
    this.taskPage = 0;
    this.goToPage(0);
  }

  claimTask(task: TaskWithForm): void {
    if (!task.id) return;

    const originalState = { ...task };
    task.isSubmittingForm = true;

    this.studentTaskService.claimTask(task.id).subscribe({
      next: (response: any) => {
        console.log('Task claimed successfully:', response);
        task.claimedByCurrentUser = true;
        task.claimedBy = this.authService.getUsername(); // Mark as claimed
        task.showForm = true;
        task.formInput = {};
        task.isSubmittingForm = false;
        this.cdr.detectChanges();
      },
      error: (error: any) => {
        console.error('Error claiming task:', error);
        let errorMsg = error.error?.message || 'Greška pri preuzimanju zadatka.';
        if (errorMsg.includes('already been claimed by another user')) {
          errorMsg = 'Zadatak sa id-jem: ' + task.id + ' je već preuzet od strane drugog korisnika.';
        }
        
        this.errorMessage = errorMsg;
        task.isSubmittingForm = false;
        this.cdr.detectChanges();
      }
    });
  }

  completeTask(task: TaskWithForm): void {
    if (!task.id) return;

    task.isSubmittingForm = true;
    this.errorMessage = '';

    this.studentTaskService.completeTask(task.id, {}).subscribe({
      next: (response: any) => {
        console.log('Task completed successfully:', response);
        task.status = 'completed';
        task.isSubmittingForm = false;
        task.showForm = false;
        this.errorMessage = '';
        this.cdr.detectChanges();
        setTimeout(() => {
          this.goToPage(this.taskPage);
        }, 1500);
      },
      error: (error: any) => {
        console.error('Error completing task:', error);
        this.errorMessage = error.error?.message || 'Greška pri završetku zadatka.';
        task.isSubmittingForm = false;
        this.cdr.detectChanges();
      }
    });
  }

  completeTask1(task: TaskWithForm): void {
    if (this.isTeacherRestrictedTask(task)) return;

    const taskKey = (task as any).bpmTaskId || task.id;
    if (!taskKey) {
      console.error('completeTask1: no task key available on task', task);
      this.errorMessage = 'Nije moguće završiti zadatak: nedostaje task identifier.';
      return;
    }

    task.isSubmittingForm = true;
    this.errorMessage = '';
    if (this.isTaskType(task, 'task2')) {
      const points = task.formInput?.['points'];
      const comment = task.formInput?.['comment'];
      const email = task.formInput?.['email'];

      if (points === undefined || points === null || comment === undefined || comment === null || comment === '' || !email) {
        this.errorMessage = 'Molimo unesite bodove, komentar i email studenta.';
        task.isSubmittingForm = false;
        this.cdr.detectChanges();
        return;
      }

      const variables = {
        points: { value: parseInt(points, 10), type: 'Long' },
        comment: { value: comment, type: 'String' },
        email: { value: email, type: 'String' }
      };

      const completionRequest = this.studentTaskService.completeTaskWithFile(taskKey, variables, task.uploadedFile || undefined);
      const request = this.authService.isAdmin()
        ? this.studentTaskService.forceClaimTask(task.id).pipe(switchMap(() => completionRequest))
        : completionRequest;

      request.subscribe({
        next: (response: any) => {
          console.log('Task completed successfully:', response);
          task.status = 'completed';
          task.isSubmittingForm = false;
          task.showForm = false;
          task.uploadedFile = null;
          this.errorMessage = '';
          this.closeHistoryModal();
          this.cdr.detectChanges();

          setTimeout(() => {
            this.goToPage(this.taskPage);
          }, 1500);
        },
        error: (error: any) => {
          console.error('Error completing task:', error);
          this.errorMessage = error.error?.message || 'Greška pri završetku zadatka.';
          task.isSubmittingForm = false;
          this.cdr.detectChanges();
        }
      });
      return;
    }
    const completionRequest = this.studentTaskService.completeTaskWithFile(taskKey, {}, task.uploadedFile || undefined);
    const request = this.authService.isAdmin()
      ? this.studentTaskService.forceClaimTask(task.id).pipe(switchMap(() => completionRequest))
      : completionRequest;

    request.subscribe({
      next: (response: any) => {
        console.log('Task completed successfully:', response);
        task.status = 'completed';
        task.isSubmittingForm = false;
        task.showForm = false;
        task.uploadedFile = null;
        this.errorMessage = '';
        this.closeHistoryModal();
        this.cdr.detectChanges();
        setTimeout(() => {
          this.goToPage(this.taskPage);
        }, 1500);
      },
      error: (error: any) => {
        console.error('Error completing task:', error);
        this.errorMessage = error.error?.message || 'Greška pri završetku zadatka.';
        task.isSubmittingForm = false;
        this.cdr.detectChanges();
      }
    });
  }

  isTaskType(task: TaskWithForm, key: string): boolean {
    const anyTask: any = task as any;
    if (anyTask.task_definition && typeof anyTask.task_definition === 'string') {
      if (anyTask.task_definition.toLowerCase() === key.toLowerCase()) return true;
      return false;
    }

    const candidates = [
      anyTask.taskDefinition,
      anyTask.taskDefinitionKey,
      anyTask.definitionKey,
      anyTask.processDefinitionKey,
      anyTask.taskKey,
      anyTask.name,
      anyTask.taskName
    ];

    for (const val of candidates) {
      if (!val) continue;
      if (typeof val === 'string') {
        const lower = val.toLowerCase();
        const needle = key.toLowerCase();
        if (lower === needle) return true;
        if (lower.includes(needle)) return true;
      }
    }

    return false;
  }

  isTeacherRestrictedTask(task: TaskWithForm): boolean {
    return this.authService.isTeacher() && (this.isTaskType(task, 'task1') || this.isTaskType(task, 'task3'));
  }

  completeTask2(task: TaskWithForm): void {
    if (this.isTeacherRestrictedTask(task)) return;

    if (!task.id) return;

    const points = task.formInput?.['points'];
    const comment = task.formInput?.['comment'];
    const email = task.formInput?.['email'];

    if (points === undefined || points === null || comment === undefined || comment === null || !email) {
      this.errorMessage = 'Molimo unesite bodove, komentar i email studenta.';
      return;
    }

    task.isSubmittingForm = true;
    this.errorMessage = '';

    const variables = {
      points: {
        value: parseInt(points, 10),
        type: 'Long'
      },
      comment: {
        value: comment,
        type: 'String'
      },
      email: {
        value: email,
        type: 'String'
      }
    };

    const completionRequest = this.studentTaskService.completeTaskWithVariables(task.id, variables);
    const request = this.authService.isAdmin()
      ? this.studentTaskService.forceClaimTask(task.id).pipe(switchMap(() => completionRequest))
      : completionRequest;

    request.subscribe({
      next: (response: any) => {
        console.log('Task completed successfully:', response);
        task.status = 'completed';
        task.isSubmittingForm = false;
        task.showForm = false;
        this.errorMessage = '';
        this.cdr.detectChanges();
        setTimeout(() => {
          this.goToPage(this.taskPage);
        }, 1500);
      },
      error: (error: any) => {
        console.error('Error completing task:', error);
        this.errorMessage = error.error?.message || 'Greška pri završetku zadatka.';
        task.isSubmittingForm = false;
        this.cdr.detectChanges();
      }
    });
  }

  cancelForm(task: TaskWithForm): void {
    task.showForm = false;
    task.formInput = {};
    task.uploadedFile = null;
    this.cdr.detectChanges();
  }

  addFormField(task: TaskWithForm): void {
    if (!task.formInput) {
      task.formInput = {};
    }
    const fieldName = `field_${Object.keys(task.formInput).length + 1}`;
    task.formInput[fieldName] = '';
    this.cdr.detectChanges();
  }

  removeFormField(task: TaskWithForm, fieldName: string): void {
    if (task.formInput) {
      delete task.formInput[fieldName];
      this.cdr.detectChanges();
    }
  }

  onFileSelected(task: TaskWithForm, event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      task.uploadedFile = input.files[0];
      this.cdr.detectChanges();
    }
  }

  viewTaskHistory(task: TaskWithForm): void {
    if (!task.id) return;

    task.isLoadingHistory = true;
    this.isLoadingTaskHistory.set(true);

    this.studentTaskService.getTaskHistory(task.id).subscribe({
      next: (response: any) => {
        console.log('Task history fetched:', response);
        const normalized: any = {
          ...response,
          id: response.id || response.taskId || response.taskInstanceId,
          name: response.taskName || response.name || response.title,
          description: response.description || response.taskDescription || '',
          claimedBy: response.assignee || response.claimedBy || response.owner || response.user,
          claimedAt: response.claimedAt || response.claimedOn || response.claimed_time,
          completedAt: response.completedAt || response.completedOn || response.endTime,
          created: response.startTime || response.created || response.startedAt,
          status: response.state || response.status,
          processInstanceId: response.processInstanceHistoryId || response.processInstanceId || (response.processInstance || {}).id,
          formData: response.formData || response.variables || response.data || {},
          studentId: response.variables?.studentId || response.formData?.studentId || null,
        };

        this.selectedTaskHistory.set(normalized);
        this.selectedTask.set(task);
        task.isLoadingHistory = false;
        this.isLoadingTaskHistory.set(false);
        const attachmentId = response?.variables?.['attachmentId'];
        const altAttachment = response?.attachmentId || response?.attachment?.id || response?.fileId;
        this.selectedTaskAttachmentId.set((attachmentId ?? altAttachment) != null ? String(attachmentId ?? altAttachment) : null);
      },
      error: (error: any) => {
        console.error('Error fetching task history:', error);
        this.errorMessage = 'Greška pri učitavanju istorije zadatka.';
        task.isLoadingHistory = false;
        this.isLoadingTaskHistory.set(false);
      }
    });
  }

  downloadAttachment(): void {
    if (!this.selectedTaskAttachmentId()) return;
    this.isDownloadingAttachment.set(true);
    this.studentTaskService.getAttachmentFile(this.selectedTaskAttachmentId()!).subscribe({
      next: (blob: Blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `attachment-${this.selectedTaskAttachmentId()}`;
        a.click();
        window.URL.revokeObjectURL(url);
        this.isDownloadingAttachment.set(false);
      },
      error: (err: any) => {
        console.error('Error fetching attachment file:', err);
        this.isDownloadingAttachment.set(false);
      }
    });
  }

  closeHistoryModal(): void {
    this.selectedTaskHistory.set(null);
    this.selectedTask.set(null);
    this.selectedTaskAttachmentId.set(null);
    this.isDownloadingAttachment.set(false);
    this.assignedTasks.forEach(task => {
      task.isLoadingHistory = false;
    });
  }

  showSelectedTaskForm(): void {
    const t = this.selectedTask();
    if (t) {
      t.showForm = true;
      this.cdr.detectChanges();
    }
  }

  openTaskDetails(task: TaskWithForm): void {
    if (!task) return;

    const possibleId = (task as any).id || (task as any).bpmTaskId || (task as any).taskId || (task as any).taskInstanceId || (task as any).task?.id;
    if (!possibleId) {
      console.warn('student-tasks: no task id available for navigation', task);
      return;
    }

    console.log('student-tasks: openTaskDetails called for', possibleId);
    this.router.navigateByUrl(`/task/${possibleId}`).then(result => {
      console.log('navigation result:', result);
    }).catch(err => {
      console.error('navigation error:', err);
    });
  }

  
  getTaskVariables(task: TaskWithForm): void {
    const candidateId = (task as any).processInstanceId || (task as any).processInstanceHistoryId || (task as any).processInstance?.id || (task as any).process?.id;

    const fetchAndUseVariables = (procId: string) => {
      if (!procId) {
        console.warn('No process id available after fallback');
        alert('Ovaj zadatak nema povezanog procesa.');
        return;
      }

      const currentUser = this.authService.getUsername();
      const needToClaim = !(task.claimedBy) || (task.claimedBy && task.claimedBy !== currentUser);

      const doFetch = () => {
        this.processService.getProcessInstanceVariables(procId).subscribe({
          next: (variables: any) => {
            console.log('Process variables:', variables);
            const documentUUID = variables?.documentUUID?.value || variables?.documentUUID;
            if (documentUUID) {
              this.downloadTaskDocument(documentUUID, task.name);
            } else {
              console.warn('No document UUID found in process variables');
              alert('Ovaj zadatak nema priloženog dokumenta.');
            }
          },
          error: (error: any) => {
            console.error('Error fetching process variables:', error);
            alert('Greška pri preuzimanju podataka dokumenta.');
          }
        });
      };

      if (needToClaim && task.id) {
        this.studentTaskService.claimTask(task.id).subscribe({
          next: (res: any) => {
            console.log('Task claimed; will retry variable fetch shortly:', res);
            task.claimedByCurrentUser = true;
            task.claimedBy = currentUser;
            setTimeout(() => {
              try {
                doFetch();
              } catch (e) {
                console.error('Retry fetch after claim failed:', e);
              }
            }, 500);
          },
          error: (err: any) => {
            console.error('Error claiming task before variable fetch:', err);
            const details = {
              status: err.status,
              statusText: err.statusText,
              body: err.error
            };
            console.error('Claim error details:', details);
            if (err.error && typeof err.error === 'string') {
              alert('Greška pri preuzimanju zadatka: ' + err.error);
            } else if (err.error && err.error.message) {
              alert('Greška pri preuzimanju zadatka: ' + err.error.message);
            } else {
              alert('Greška pri preuzimanju zadatka. Pogledajte konzolu za detalje.');
            }
          }
        });
      } else {
        doFetch();
      }
    };

    if (candidateId) {
      fetchAndUseVariables(candidateId);
      return;
    }
    if (!task.id) {
      console.warn('No task id available to lookup history');
      alert('Ovaj zadatak nema povezanog procesa.');
      return;
    }

    this.studentTaskService.getTaskHistory(task.id).subscribe({
      next: (history: any) => {
        console.log('Task history for variable lookup:', history);
        const procIdFromHistory = history?.processInstanceHistoryId || history?.processInstanceId || history?.processInstance?.id || history?.processInstanceHistory?.id;
        fetchAndUseVariables(procIdFromHistory);
      },
      error: (err: any) => {
        console.error('Error fetching task history while resolving process id:', err);
        alert('Ovaj zadatak nema povezanog procesa.');
      }
    });
  }

  
  downloadTaskDocument(documentUUID: string, taskName: string): void {
    this.processService.downloadDocument(documentUUID).subscribe({
      next: (response: any) => {
        const blob = response.body;
        let filename = `${taskName}-${documentUUID}`;
        const contentDisposition = response.headers?.get('content-disposition');
        
        if (contentDisposition) {
          const filenameMatch = contentDisposition.match(/filename="?([^"]+)"?/);
          if (filenameMatch && filenameMatch[1]) {
            filename = filenameMatch[1];
          }
        }
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        console.log('Document downloaded successfully:', filename);
      },
      error: (error: any) => {
        console.error('Error downloading document:', error);
        alert('Greška pri preuzimanju dokumenta.');
      }
    });
  }

  getInitials(task: TaskWithForm): string {
    const raw = (task.claimedBy || (task as any).assignee || '') as string;
    if (!raw) return '';
    const cleaned = raw.replace(/[._\-]/g, ' ').trim();
    const parts = cleaned.split(/\s+/).filter(Boolean);
    if (parts.length === 0) return '';
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    const first = parts[0][0] || '';
    const last = parts[parts.length - 1][0] || '';
    return (first + last).toUpperCase();
  }

  
  getFilteredFormData(formData: Record<string, any> | undefined | null): Array<{ key: string; value: any }> {
    if (!formData) return [];
    const excluded = new Set(['attachmentId', 'studentId', 'uploadedFile']);
    return Object.keys(formData)
      .filter(k => !excluded.has(k))
      .map(k => ({ key: k, value: formData[k] }));
  }
}
