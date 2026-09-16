import { Component, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ReportService } from './reports.service';
import * as XLSX from 'xlsx';
import { Router } from '@angular/router';
import { AuthService } from '../auth.service';
import { translateStatus } from '../status-translations';

@Component({
  selector: 'app-moji-izvestaji',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './moji-izvestaji.component.html',
  styleUrls: ['./moji-izvestaji.component.css']
})
export class MojiIzvestajiComponent {
  filter = {
    businessKey: '',
    processInitiatorId: '',
    state: '',
    fromModified: '',
    toModified: ''
  };

  reportData: any[] = [];
  isLoading: boolean = false;
  errorMessage: string = '';
  hasSearched: boolean = false;
  currentPage: number = 0;
  totalPages: number = 0;
  totalElements: number = 0;
  readonly pageSize = 10;
  currentUsername = '';
  translateStatus = translateStatus;

  get effectiveUserName(): string {
    return this.authService.getUsername();
  }

  get isTeacherOnly(): boolean {
    return this.authService.isTeacher() && !this.authService.isAdmin();
  }

  get isStudentUser(): boolean {
    return this.authService.isStudent();
  }

  get isAdminUser(): boolean {
    return this.authService.isAdmin();
  }

  constructor(
    private reportService: ReportService,
    private cdr: ChangeDetectorRef,
    private router: Router,
    private authService: AuthService
  ) {
    this.currentUsername = this.authService.getUsername();
    this.applyTeacherDefaults();
  }

  private applyTeacherDefaults(): void {
    const effectiveUsername = this.authService.getUsername();
    if (effectiveUsername && this.isTeacherOnly) {
      this.currentUsername = effectiveUsername;
      this.filter.processInitiatorId = effectiveUsername;
      return;
    }

    if (this.authService.isAdmin()) {
      this.currentUsername = effectiveUsername;
      this.filter.processInitiatorId = '';
      return;
    }

    if (effectiveUsername && this.authService.isStudent()) {
      this.currentUsername = effectiveUsername;
    }
  }

  goBack(): void {
    this.router.navigateByUrl('/aktivni-predmeti');
  }

  generateReport(): void {
    this.applyTeacherDefaults();
    this.currentPage = 0;
    this.loadPage();
  }

  loadPage(): void {
    this.isLoading = true;
    this.errorMessage = '';
    this.hasSearched = true;

    this.applyTeacherDefaults();

    if (this.isTeacherOnly) {
      this.filter.processInitiatorId = this.currentUsername || this.authService.getUsername();
    } else if (this.authService.isAdmin()) {
      this.filter.processInitiatorId = '';
    }

    this.reportService.getReportData(
      this.filter.businessKey,
      this.filter.state,
      this.filter.processInitiatorId,
      this.filter.fromModified,
      this.filter.toModified,
      this.currentPage,
      this.pageSize
    ).subscribe({
      next: (response: any) => {
        if (response && response.content) {
          this.reportData = response.content;
          this.totalPages = response.totalPages ?? 0;
          this.totalElements = response.totalElements ?? response.content.length;
        } else {
          this.reportData = Array.isArray(response) ? response : [];
          this.totalPages = 1;
          this.totalElements = this.reportData.length;
        }
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (error: any) => {
        console.error('Greška pri povlačenju izveštaja', error);
        this.errorMessage = 'Došlo je do greške pri generisanju izveštaja.';
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  previousPage(): void {
    if (this.currentPage > 0) { this.currentPage--; this.loadPage(); }
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages - 1) { this.currentPage++; this.loadPage(); }
  }

  exportToExcel(): void {
    if (this.reportData.length === 0) return;
    const dataForExcel = this.reportData.map(item => ({
      'ID Procesa': item.camundaInstanceId || item.processInstanceHistoryId,
      'Business Key': item.businessKey || item.processDefinitionKey || item.processDefinitionId,
      'Status': translateStatus(item.state),
      'Pokretač': item.startUserId || item.processInitiatorId || 'Nepoznato',
      'Datum kreiranja': item.startTime || item.createdAt,
      'Datum završetka': item.endTime || item.endTime || 'U toku'
    }));
    const worksheet: XLSX.WorkSheet = XLSX.utils.json_to_sheet(dataForExcel);
    const workbook: XLSX.WorkBook = { Sheets: { 'Izvestaj': worksheet }, SheetNames: ['Izvestaj'] };
    XLSX.writeFile(workbook, `Izvestaj_Predmeti_${new Date().getTime()}.xlsx`);
  }
}