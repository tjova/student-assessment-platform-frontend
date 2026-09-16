import { Component, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import * as XLSX from 'xlsx';
import { StudentTaskService } from '../student-tasks/student-task.service';
import { translateTaskName } from '../task-name-translations';
import { translateStatus } from '../status-translations';

@Component({
  selector: 'app-student-report',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './student-report.component.html',
  styleUrls: ['./student-report.component.css']
})
export class StudentReportComponent {
  filter = {
    state: '',
    taskName: '',
    fromModified: '',
    toModified: '',
    businessKey: ''
  };

  reportData: any[] = [];
  isLoading = false;
  errorMessage = '';
  hasSearched = false;
  currentPage = 0;
  totalPages = 0;
  totalElements = 0;
  readonly pageSize = 10;
  translateStatus = translateStatus;

  constructor(
    private studentTaskService: StudentTaskService,
    private cdr: ChangeDetectorRef,
    private router: Router
  ) {}

  goBack(): void {
    this.router.navigateByUrl('/moji-zadaci');
  }

  generateReport(): void {
    this.currentPage = 0;
    this.loadPage();
  }

  loadPage(): void {
    this.isLoading = true;
    this.errorMessage = '';
    this.hasSearched = true;

    this.studentTaskService.getTaskReport(
      this.filter.state || undefined,
      this.filter.taskName || undefined,
      this.filter.fromModified || undefined,
      this.filter.toModified || undefined,
      this.filter.businessKey || undefined,
      this.currentPage,
      this.pageSize
    ).subscribe({
      next: (response: any) => {
        if (response?.content) {
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
      error: () => {
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

  translateTaskName = translateTaskName;

  resetFilter(): void {
    this.filter = { state: '', taskName: '', fromModified: '', toModified: '', businessKey: '' };
    this.reportData = [];
    this.hasSearched = false;
    this.currentPage = 0;
    this.totalPages = 0;
    this.totalElements = 0;
  }

  exportToExcel(): void {
    if (this.reportData.length === 0) return;

    const dataForExcel = this.reportData.map(item => ({
      'Naziv zadatka': this.translateTaskName(item.taskName || item.name || '—'),
      'ID Procesa': item.processInstanceId || item.processInstanceHistoryId || '—',
      'Status': translateStatus(item.state || item.status),
      'Dodeljen': item.assignee || item.claimedBy || '—',
      'Datum pokretanja': item.startTime || item.created || '—',
      'Datum završetka': item.completedAt || item.endTime || '—'
    }));

    const worksheet: XLSX.WorkSheet = XLSX.utils.json_to_sheet(dataForExcel);
    const workbook: XLSX.WorkBook = { Sheets: { 'Izvestaj': worksheet }, SheetNames: ['Izvestaj'] };
    XLSX.writeFile(workbook, `Izvestaj_Zadaci_${new Date().getTime()}.xlsx`);
  }
}
