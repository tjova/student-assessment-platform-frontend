import { Component, OnInit, ChangeDetectorRef } from '@angular/core'; 
import { CommonModule } from '@angular/common'; 
import { FormsModule } from '@angular/forms';
import { ProcessInstanceService } from './process-instance.service';
import { CamundaProcessDefinitionResponseDto, ProcessInstance } from './process-instance.model';
import { TaskService } from './task.service';
import { Task } from './task.model';
import { Router } from '@angular/router';
import { AuthService } from '../auth.service';
import { StudentTasksComponent } from '../student-tasks/student-tasks.component';
import { StudentTaskService } from '../student-tasks/student-task.service';
import { translateTaskName } from '../task-name-translations';
import { translateStatus } from '../status-translations';

@Component({
  selector: 'app-active-processes',
  standalone: true,
  imports: [CommonModule, FormsModule, StudentTasksComponent],
  templateUrl: './active-processes.component.html',
  styleUrls: ['./active-processes.component.css']
})
export class ActiveProcessesComponent implements OnInit {
  activeProcesses: ProcessInstance[] = []; 
  processPage: number = 0;
  processPageSize: number = 10;
  processTotalPages: number = 0;
  processTotalElements: number = 0;
  activeTasks: Task[] = [];
  taskPage: number = 0;
  taskPageSize: number = 10;
  taskTotalPages: number = 0;
  taskTotalElements: number = 0;
  isLoading: boolean = true;
  errorMessage: string = '';
  activeTab: 'processes' | 'tasks' = 'processes';
  processView: 'active' | 'history' = 'active';
  historyProcesses: ProcessInstance[] = [];
  historyPage: number = 0;
  historyPageSize: number = 10;
  historyTotalPages: number = 0;
  isLoadingHistory: boolean = false;
  showStartProcessModal: boolean = false;
  isSubmittingForm: boolean = false;
  formErrorMessage: string = '';
  formSuccessMessage: string = '';
  processDefinitions: CamundaProcessDefinitionResponseDto[] = [];
  isLoadingDefinitions: boolean = false;
  startProcessForm = {
    processDefinitionKey: '',
    processName: '',
    studentIds: [] as string[],
    file: null as File | null
  };

  selectedFileName: string = '';
  selectedProcessWithTasks: any = null;
  isLoadingProcessDetails: boolean = false;
  selectedTaskDetail: any = null;
  selectedTaskForDetail: Task | null = null;
  isLoadingTaskDetail: boolean = false;
  selectedTaskAttachmentId: string | null = null;
  isDownloadingAttachment: boolean = false;
  showUsersModal: boolean = false;
  users: any[] = [];
  studentUsers: any[] = [];
  isStudentDropdownOpen: boolean = false;
  isLoadingUsers: boolean = false;
  usersError: string = '';
  isProfessor: boolean = false;
  isTeacher: boolean = false;
  currentUsername: string = '';
  translateTaskName = translateTaskName;
  translateStatus = translateStatus;

  constructor(
    private processService: ProcessInstanceService,
    private taskService: TaskService,
    private cdr: ChangeDetectorRef,
    private router: Router,
    private authService: AuthService,
    private studentTaskService: StudentTaskService
  ) {}

  ngOnInit(): void {
    this.isProfessor = this.authService.isProfessor();
    this.isTeacher = this.authService.isTeacher();
    this.currentUsername = this.authService.getUsername();
    this.fetchActiveProcesses(0);
    this.fetchActiveTasks(0);
  }

  switchTab(tab: 'processes' | 'tasks'): void {
    this.activeTab = tab;
    this.cdr.detectChanges();
  }

  switchProcessView(view: 'active' | 'history'): void {
    if (this.processView === view) return;
    this.processView = view;
    if (view === 'history' && this.historyProcesses.length === 0) {
      this.fetchHistoryProcesses(0);
    }
    this.cdr.detectChanges();
  }

  fetchHistoryProcesses(page: number = 0): void {
    this.isLoadingHistory = true;
    const initiatorId = this.authService.isTeacher() ? this.authService.getUsername() : undefined;
    this.processService.getCompletedProcesses(page, this.historyPageSize, initiatorId).subscribe({
      next: (response: any) => {
        if (response && response.content) {
          this.historyProcesses = response.content;
          this.historyTotalPages = response.totalPages || 0;
          this.historyPage = (typeof response.number === 'number') ? response.number : page;
        } else if (Array.isArray(response)) {
          this.historyProcesses = response;
          this.historyTotalPages = 1;
          this.historyPage = 0;
        } else {
          this.historyProcesses = [];
        }
        this.isLoadingHistory = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.isLoadingHistory = false;
        this.cdr.detectChanges();
      }
    });
  }

  previousHistoryPage(): void { if (this.historyPage > 0) this.fetchHistoryProcesses(this.historyPage - 1); }
  nextHistoryPage(): void { if (this.historyPage < this.historyTotalPages - 1) this.fetchHistoryProcesses(this.historyPage + 1); }

  fetchActiveProcesses(page: number = 0) {
    this.isLoading = true;
    const initiatorId = this.authService.isTeacher() ? this.authService.getUsername() : undefined;
    this.processService.getActiveProcesses(page, this.processPageSize, initiatorId).subscribe({
      next: (response: any) => {
        console.log('Processes API call SUCCESS!', response);

        if (response && response.content) {
          this.activeProcesses = response.content;
          this.processTotalPages = response.totalPages || 0;
          this.processTotalElements = response.totalElements || 0;
          this.processPage = (typeof response.number === 'number') ? response.number : page;
          this.processPageSize = response.size || this.processPageSize;
          console.log('Success! Process Items:', this.activeProcesses.length);
        } else if (Array.isArray(response)) {
          this.activeProcesses = response;
          this.processTotalPages = 1;
          this.processTotalElements = response.length;
          this.processPage = 0;
        } else {
          console.warn('Unexpected response format:', response);
          this.activeProcesses = [];
        }

        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Processes API call FAILED:', error);
        this.errorMessage = 'Greška pri učitavanju predmeta.';
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  fetchActiveTasks(page: number = 0) {
    const initiatorId = this.authService.isTeacher() ? this.authService.getUsername() : undefined;
    this.taskService.getActiveTasks(page, this.taskPageSize, initiatorId).subscribe({
      next: (response: any) => {
        console.log('Tasks API call SUCCESS!', response);

        if (response && response.content) {
          this.activeTasks = (response.content || []).map((task: any) => ({
            ...task,
            status: ((task as any).state || task.status || '').toString().toLowerCase()
          }));
          this.taskTotalPages = response.totalPages || 0;
          this.taskTotalElements = response.totalElements || 0;
          this.taskPage = (typeof response.number === 'number') ? response.number : page;
          this.taskPageSize = response.size || this.taskPageSize;
          console.log('Success! Task Items:', this.activeTasks.length);
        } else if (Array.isArray(response)) {
          this.activeTasks = (response || []).map((task: any) => ({
            ...task,
            status: ((task as any).state || task.status || '').toString().toLowerCase()
          }));
          this.taskTotalPages = 1;
          this.taskTotalElements = response.length;
          this.taskPage = 0;
        } else {
          console.warn('Unexpected response format:', response);
          this.activeTasks = [];
        }

        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Tasks API call FAILED:', error);
        this.cdr.detectChanges();
      }
    });
  }

  goToProcessPage(page: number) {
    if (page < 0 || (this.processTotalPages && page >= this.processTotalPages)) return;
    this.fetchActiveProcesses(page);
  }

  previousProcessPage() { this.goToProcessPage(this.processPage - 1); }
  nextProcessPage() { this.goToProcessPage(this.processPage + 1); }

  goToTaskPage(page: number) {
    if (page < 0 || (this.taskTotalPages && page >= this.taskTotalPages)) return;
    this.fetchActiveTasks(page);
  }

  previousTaskPage() { this.goToTaskPage(this.taskPage - 1); }
  nextTaskPage() { this.goToTaskPage(this.taskPage + 1); }

  openStartProcessModal(): void {
    this.showStartProcessModal = true;
    this.formErrorMessage = '';
    this.formSuccessMessage = '';
    this.selectedFileName = '';
    this.studentUsers = [];
    this.isStudentDropdownOpen = false;
    this.startProcessForm = {
      processDefinitionKey: '',
      processName: '',
      studentIds: [],
      file: null
    };
    this.loadProcessDefinitions();
    this.fetchUsers();
  }

  loadProcessDefinitions(): void {
    this.isLoadingDefinitions = true;
    this.processService.getProcessDefinitions().subscribe({
      next: (defs) => {
        this.processDefinitions = defs;
        this.isLoadingDefinitions = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.isLoadingDefinitions = false;
        this.formErrorMessage = 'Greška pri učitavanju definicija procesa.';
        this.cdr.detectChanges();
      }
    });
  }

  closeStartProcessModal(): void {
    this.showStartProcessModal = false;
    this.isStudentDropdownOpen = false;
    this.formErrorMessage = '';
    this.formSuccessMessage = '';
  }

  get isStartProcessFormInvalid(): boolean {
    const trimmedId = this.startProcessForm.processDefinitionKey.trim();
    const trimmedProcessName = this.startProcessForm.processName.trim();
    const studentIdsArray = this.startProcessForm.studentIds;

    return this.isSubmittingForm || !trimmedId || !trimmedProcessName || studentIdsArray.length === 0;
  }

  submitStartProcess(): void {
    const trimmedId = this.startProcessForm.processDefinitionKey.trim();
    const trimmedProcessName = this.startProcessForm.processName.trim();
    const studentIdsArray = this.startProcessForm.studentIds;

    console.log('=== Form Validation ===');
    console.log('Process Definition ID entered:', this.startProcessForm.processDefinitionKey);
    console.log('Process Definition ID trimmed:', trimmedId);
    console.log('Process Name entered:', this.startProcessForm.processName);
    console.log('Process Name trimmed:', trimmedProcessName);
    console.log('Student IDs selected:', studentIdsArray);

    if (!trimmedId) {
      this.formErrorMessage = 'Molimo unesite ID definicije procesa.';
      return;
    }

    if (!trimmedProcessName) {
      this.formErrorMessage = 'Molimo unesite ime predmeta.';
      return;
    }

    if (studentIdsArray.length === 0) {
      this.formErrorMessage = 'Molimo unesite najmanje jednog studenta.';
      return;
    }

    this.isSubmittingForm = true;
    this.formErrorMessage = '';
    this.formSuccessMessage = '';

    try {
      if (this.startProcessForm.file) {
        this.processService.startProcessWithFile(
          this.startProcessForm.processDefinitionKey,
          this.startProcessForm.processName,
          studentIdsArray,
          this.startProcessForm.file,
          true
        ).subscribe({
          next: (response: any) => {
            console.log('Process started successfully with uploaded file:', response);
            this.formSuccessMessage = 'Proces je uspešno pokrenut sa dokumentom!';
            this.isSubmittingForm = false;
            this.cdr.detectChanges();

            setTimeout(() => {
              this.goToProcessPage(this.processPage);
              this.closeStartProcessModal();
            }, 1500);
          },
          error: (error: any) => {
            console.error('Error starting process with file:', error);
            this.formErrorMessage = error.error?.message || 'Greška pri pokretanju procesa sa dokumentom.';
            this.isSubmittingForm = false;
            this.cdr.detectChanges();
          }
        });
      } else {
        console.log('Starting process with values:', {
          processDefinitionKey: this.startProcessForm.processDefinitionKey,
          processName: this.startProcessForm.processName,
          studentIds: studentIdsArray
        });

        this.processService.startProcess(
          this.startProcessForm.processDefinitionKey,
          this.startProcessForm.processName,
          studentIdsArray
        ).subscribe({
          next: (response: any) => {
            console.log('Process started successfully:', response);
            this.formSuccessMessage = 'Proces je uspešno pokrenut!';
            this.isSubmittingForm = false;
            this.cdr.detectChanges();
            setTimeout(() => {
              this.goToProcessPage(this.processPage);
              this.closeStartProcessModal();
            }, 1500);
          },
          error: (error: any) => {
            console.error('Error starting process:', error);
            this.formErrorMessage = error.error?.message || 'Greška pri pokretanju procesa.';
            this.isSubmittingForm = false;
            this.cdr.detectChanges();
          }
        });
      }
    } catch (error) {
      console.error('Unexpected error:', error);
      this.formErrorMessage = 'Neočekivana greška. Molimo pokušajte ponovno.';
      this.isSubmittingForm = false;
      this.cdr.detectChanges();
    }
  }

  onFileSelected(event: any): void {
    const file: File = event.target.files[0];
    if (file) {
      this.startProcessForm.file = file;
      this.selectedFileName = file.name;
    }
  }

  viewProcessDetails(process: ProcessInstance): void {
    if (!process.processInstanceHistoryId) return;

    this.isLoadingProcessDetails = true;
    this.processService.getProcessInstanceWithTasks(process.processInstanceHistoryId).subscribe({
      next: (response: any) => {
        console.log('Process details fetched:', response);
        this.selectedProcessWithTasks = response;
        this.isLoadingProcessDetails = false;
        this.cdr.detectChanges();
      },
      error: (error: any) => {
        console.error('Error fetching process details:', error);
        this.errorMessage = 'Greška pri učitavanju detalja procesa.';
        this.isLoadingProcessDetails = false;
        this.cdr.detectChanges();
      }
    });
  }

  closeProcessDetailsModal(): void {
    this.selectedProcessWithTasks = null;
    this.cdr.detectChanges();
  }

  openUsersModal(): void {
    console.log('openUsersModal() called');
    this.showUsersModal = true;
    this.users = [];
    this.usersError = '';
    this.cdr.detectChanges();
    this.fetchUsers();
  }

  closeUsersModal(): void {
    this.showUsersModal = false;
    this.users = [];
    this.usersError = '';
    this.cdr.detectChanges();
  }

  goToReports(): void {
    this.router.navigateByUrl('/moji-izvestaji').then(result => {
      console.log('Navigated to reports:', result);
    }).catch(err => console.error('Navigation error to reports:', err));
  }

  fetchUsers(): void {
    console.log('fetchUsers() starting request to /api/users');
    this.isLoadingUsers = true;
    this.cdr.detectChanges();
    this.processService.getUsers().subscribe({
      next: (res: any) => {
        console.log('fetchUsers() http response:', res);
        this.users = Array.isArray(res) ? res : (res?.content || []);
        this.studentUsers = this.users.filter((user: any) => this.isStudentUser(user));
        this.isLoadingUsers = false;
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        console.error('Error fetching users:', err);
        this.usersError = 'Greška pri učitavanju korisnika.';
        this.studentUsers = [];
        this.isLoadingUsers = false;
        this.cdr.detectChanges();
      }
    });
    try {
      const authHeader = this.authService.getAuthHeader();
      const fetchOpts: any = { method: 'GET', cache: 'no-store', headers: {} };
      if (authHeader) fetchOpts.headers['Authorization'] = authHeader;
      console.log('fetchUsers() issuing native fetch for visibility', fetchOpts);
      fetch('/api/users', fetchOpts)
        .then(async (r) => {
          console.log('native fetch status', r.status, r.statusText);
          try {
            const json = await r.json();
            console.log('native fetch json', json);
          } catch (e) {
            console.warn('native fetch no-json body', e);
          }
        }).catch(e => console.error('native fetch error', e));
    } catch (e) {
      console.warn('native fetch fallback failed', e);
    }
  }

  private isStudentUser(user: any): boolean {
    const roles = user?.roles ?? user?.role;
    const roleNames = Array.isArray(roles) ? roles : [roles];
    return roleNames.some((role: unknown) => String(role ?? '').toLowerCase() === 'student');
  }

  getStudentId(student: any): string {
    return String(
      student?.id ??
      student?.userId ??
      student?.user_id ??
      student?.username ??
      student?.userName ??
      student?.login ??
      ''
    ).trim();
  }

  isStudentSelected(student: any): boolean {
    return this.startProcessForm.studentIds.includes(this.getStudentId(student));
  }

  toggleStudentDropdown(): void {
    if (!this.isSubmittingForm && !this.isLoadingUsers && this.studentUsers.length > 0) {
      this.isStudentDropdownOpen = !this.isStudentDropdownOpen;
    }
  }

  toggleStudentSelection(student: any): void {
    if (this.isSubmittingForm) return;

    const studentId = this.getStudentId(student);
    if (!studentId) return;

    const selectedIds = this.startProcessForm.studentIds;
    this.startProcessForm.studentIds = this.isStudentSelected(student)
      ? selectedIds.filter(id => id !== studentId)
      : [...selectedIds, studentId];
  }

  openTaskDetails(task: Task): void {
    console.log('active-processes: openTaskDetails clicked, task object:', task);

    if (!task) return;

    const possibleId = (task as any).id || (task as any).taskId || (task as any).taskInstanceId || (task as any).task?.id;
    if (!possibleId) {
      console.warn('active-processes: no task id found on clicked task');
      return;
    }

    this.selectedTaskForDetail = task;
    this.isLoadingTaskDetail = true;
    this.selectedTaskDetail = {};
    this.cdr.detectChanges();

    this.studentTaskService.getTaskHistory(possibleId).subscribe({
      next: (response: any) => {
        const vars = response.variables || {};
        const attachmentId = vars['attachmentId'] ?? response?.attachmentId ?? response?.attachment?.id ?? response?.fileId;
        this.selectedTaskAttachmentId = attachmentId != null ? String(attachmentId) : null;

        this.selectedTaskDetail = {
          ...response,
          id: response.id || response.taskId || response.taskInstanceId,
          name: response.taskName || response.name || response.title,
          assignee: response.assignee || response.claimedBy || response.owner,
          startTime: response.startTime || response.created || response.startedAt,
          endTime: response.endTime || response.completedAt || response.completedOn,
          processInstanceId: response.processInstanceHistoryId || response.processInstanceId || (response.processInstance || {}).id,
          status: response.state || response.status,
          studentId: vars['studentId'] || null,
          formData: response.formData || response.data || {},
        };
        this.isLoadingTaskDetail = false;
        this.cdr.detectChanges();
      },
      error: (error: any) => {
        console.error('Error fetching task details:', error);
        this.isLoadingTaskDetail = false;
        this.selectedTaskDetail = null;
        this.selectedTaskForDetail = null;
        this.cdr.detectChanges();
      }
    });
  }

  closeTaskDetailModal(): void {
    this.selectedTaskDetail = null;
    this.selectedTaskForDetail = null;
    this.isLoadingTaskDetail = false;
    this.selectedTaskAttachmentId = null;
    this.isDownloadingAttachment = false;
    this.cdr.detectChanges();
  }

  downloadTaskAttachment(): void {
    if (!this.selectedTaskAttachmentId) return;
    this.isDownloadingAttachment = true;
    this.studentTaskService.getAttachmentFile(this.selectedTaskAttachmentId).subscribe({
      next: (blob: Blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `attachment-${this.selectedTaskAttachmentId}`;
        a.click();
        window.URL.revokeObjectURL(url);
        this.isDownloadingAttachment = false;
        this.cdr.detectChanges();
      },
      error: (error: any) => {
        console.error('Error downloading attachment:', error);
        this.isDownloadingAttachment = false;
        this.cdr.detectChanges();
      }
    });
  }

  
  getTaskVariables(task: Task): void {
    if (!task.processInstanceId) {
      console.warn('Task does not have processInstanceId');
      return;
    }

    this.processService.getProcessInstanceVariables(task.processInstanceId).subscribe({
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
}
