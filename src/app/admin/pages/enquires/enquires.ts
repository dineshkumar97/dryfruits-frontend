
import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';

import {
  ContactEnquiry,
  ContactEnquiryService,
  ContactStatus
} from '../../../core/services/contact-enquiry';

import { Toast } from '../../../core/services/toast';

@Component({
  selector: 'app-enquires',
  standalone: true,
  imports: [CommonModule, FormsModule, DatePipe],
  templateUrl: './enquires.html',
  styleUrl: './enquires.scss',
})
export class Enquires implements OnInit {

  enquiries: ContactEnquiry[] = [];

  selectedEnquiry: ContactEnquiry | null = null;

  isLoading = false;
  isDetailsLoading = false;
  isUpdating = false;
  isSendingReply = false;

  searchText = '';
  selectedStatus: ContactStatus | '' = '';

  currentPage = 1;
  pageSize = 10;
  totalRecords = 0;
  totalPages = 0;

  replyMessage = '';

  readonly statuses: ContactStatus[] = [
    'NEW',
    'READ',
    'REPLIED',
    'CLOSED'
  ];

  constructor(
    private contactService: ContactEnquiryService,
    private toast: Toast
  ) {}

  ngOnInit(): void {
    this.loadEnquiries();
  }

  // Load all enquiries
  loadEnquiries(): void {
    this.isLoading = true;

    this.contactService.getAllContacts(
      this.currentPage,
      this.pageSize,
      this.selectedStatus,
      this.searchText
    ).subscribe({
      next: (response) => {
        this.isLoading = false;

        if (response.success) {
          this.enquiries = response.data || [];
          this.totalRecords = response.pagination.total;
          this.currentPage = response.pagination.page;
          this.totalPages = response.pagination.totalPages;
        } else {
          this.toast.error(
            response.message || 'Unable to load enquiries.'
          );
        }
      },
      error: (error: HttpErrorResponse) => {
        this.isLoading = false;

        this.toast.error(
          error.error?.message || 'Failed to load contact enquiries.'
        );

        console.error('Contact enquiries error:', error);
      }
    });
  }

  // Search enquiries
  searchEnquiries(): void {
    this.currentPage = 1;
    this.loadEnquiries();
  }

  // Filter by status
  filterByStatus(): void {
    this.currentPage = 1;
    this.loadEnquiries();
  }

  // Clear search and filters
  clearFilters(): void {
    this.searchText = '';
    this.selectedStatus = '';
    this.currentPage = 1;
    this.loadEnquiries();
  }

  // View enquiry details
  viewEnquiry(id: string): void {
    this.isDetailsLoading = true;
    this.selectedEnquiry = null;
    this.replyMessage = '';

    this.contactService.getContactById(id).subscribe({
      next: (response) => {
        this.isDetailsLoading = false;

        if (response.success) {
          this.selectedEnquiry = response.data;
        } else {
          this.toast.error(
            response.message || 'Unable to load enquiry details.'
          );
        }
      },
      error: (error: HttpErrorResponse) => {
        this.isDetailsLoading = false;

        this.toast.error(
          error.error?.message || 'Failed to load enquiry details.'
        );
      }
    });
  }

  // Close details modal
  closeDetails(): void {
    this.selectedEnquiry = null;
    this.replyMessage = '';
  }

  // Update enquiry status
  updateStatus(
    enquiry: ContactEnquiry,
    status: ContactStatus
  ): void {

    if (this.isUpdating || enquiry.status === status) {
      return;
    }

    this.isUpdating = true;

    this.contactService.updateContactStatus(
      enquiry._id,
      status
    ).subscribe({
      next: (response) => {
        this.isUpdating = false;

        if (response.success) {
          this.toast.success(
            response.message || 'Enquiry status updated successfully.'
          );

          this.selectedEnquiry = response.data;
          this.loadEnquiries();
        } else {
          this.toast.error(
            response.message || 'Unable to update enquiry status.'
          );
        }
      },
      error: (error: HttpErrorResponse) => {
        this.isUpdating = false;

        this.toast.error(
          error.error?.message || 'Failed to update enquiry status.'
        );
      }
    });
  }

  // Send customer email reply
  sendReply(): void {

    if (!this.selectedEnquiry) {
      this.toast.error('Please select an enquiry.');
      return;
    }

    const message = this.replyMessage.trim();

    if (!message) {
      this.toast.error('Please enter a reply message.');
      return;
    }

    if (message.length > 5000) {
      this.toast.error('Reply cannot exceed 5000 characters.');
      return;
    }

    if (this.isSendingReply) {
      return;
    }

    this.isSendingReply = true;

    this.contactService.sendReply(
      this.selectedEnquiry._id,
      message
    ).subscribe({

      next: (response) => {
        this.isSendingReply = false;

        if (response.success) {

          // Update selected enquiry with latest reply history
          this.selectedEnquiry = response.data;

          // Clear reply input
          this.replyMessage = '';

          // Refresh enquiry list and status
          this.loadEnquiries();

          this.toast.success(
            response.message || 'Reply sent successfully!'
          );

        } else {
          this.toast.error(
            response.message || 'Unable to send reply.'
          );
        }
      },

      error: (error: HttpErrorResponse) => {
        this.isSendingReply = false;

        console.error('Send contact reply error:', error);

        this.toast.error(
          error.error?.message || 'Failed to send email reply.'
        );
      }
    });
  }

  // Previous page
  previousPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.loadEnquiries();
    }
  }

  // Next page
  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.loadEnquiries();
    }
  }

  // Refresh
  refresh(): void {
    this.loadEnquiries();
  }

  // Status CSS class
  getStatusClass(status: ContactStatus): string {
    return status.toLowerCase();
  }

  // Character count
  get replyCharacterCount(): number {
    return this.replyMessage.length;
  }

  // Starting record
  get startRecord(): number {
    return this.totalRecords === 0
      ? 0
      : (this.currentPage - 1) * this.pageSize + 1;
  }

  // Ending record
  get endRecord(): number {
    return Math.min(
      this.currentPage * this.pageSize,
      this.totalRecords
    );
  }
}
