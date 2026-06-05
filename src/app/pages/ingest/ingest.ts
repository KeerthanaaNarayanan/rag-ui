import { Component, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';
import { RagApiService } from '../../services/rag-api';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-ingest',
  imports: [FormsModule],
  templateUrl: './ingest.html',
  styleUrl: './ingest.css',
})
export class Ingest {
  readonly activeTab = signal<'pdf' | 'text'>('pdf');
  readonly selectedPdfFile = signal<File | null>(null);
  readonly isDragActive = signal(false);
  readonly isLoading = signal(false);
  readonly successChunkCount = signal<number | null>(null);
  readonly errorMessage = signal<string | null>(null);
  sourceName = '';
  rawText = '';

  constructor(
    private readonly ragApiService: RagApiService,
    private readonly toastService: ToastService
  ) {}

  setActiveTab(tab: 'pdf' | 'text'): void {
    this.activeTab.set(tab);
    this.successChunkCount.set(null);
    this.errorMessage.set(null);
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    this.isDragActive.set(true);
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    this.isDragActive.set(false);
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    this.isDragActive.set(false);
    const file = event.dataTransfer?.files?.[0] ?? null;
    this.selectedPdfFile.set(file);
  }

  onFileBrowseChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;
    this.selectedPdfFile.set(file);
  }

  canSubmitRawText(): boolean {
    return this.sourceName.trim().length > 0 && this.rawText.trim().length > 0;
  }

  submitPdf(): void {
    const file = this.selectedPdfFile();
    if (!file || this.isLoading()) {
      return;
    }

    const formData = new FormData();
    formData.append('file', file);
    this.successChunkCount.set(null);
    this.errorMessage.set(null);
    this.isLoading.set(true);

    this.ragApiService
      .ingestFile(formData)
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (response) => {
          const chunkCount = this.extractChunkCount(response);
          this.successChunkCount.set(chunkCount);
          this.errorMessage.set(null);
          this.toastService.show(`Ingestion complete. Created ${chunkCount} chunks.`, 'success');
        },
        error: (error: HttpErrorResponse) => {
          const message = this.mapIngestError(error);
          this.errorMessage.set(message);
          this.toastService.show(message, 'error');
        },
      });
  }

  submitRawText(): void {
    if (!this.canSubmitRawText() || this.isLoading()) {
      return;
    }

    const payload = {
      source_name: this.sourceName.trim(),
      text: this.rawText.trim(),
    };
    this.successChunkCount.set(null);
    this.errorMessage.set(null);
    this.isLoading.set(true);

    this.ragApiService
      .ingestText(payload)
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (response) => {
          const chunkCount = this.extractChunkCount(response);
          this.successChunkCount.set(chunkCount);
          this.errorMessage.set(null);
          this.toastService.show(`Ingestion complete. Created ${chunkCount} chunks.`, 'success');
        },
        error: (error: HttpErrorResponse) => {
          const message = this.mapIngestError(error);
          this.errorMessage.set(message);
          this.toastService.show(message, 'error');
        },
      });
  }

  private mapIngestError(error: HttpErrorResponse): string {
    if (error.status === 0) {
      return 'Cannot reach the Flask server. Make sure it is running on http://localhost:5000.';
    }

    const backendMessage = this.extractBackendMessage(error.error);
    const lowerMessage = backendMessage.toLowerCase();

    if (error.status === 413 || lowerMessage.includes('too large')) {
      return 'File too large. Please upload a smaller PDF.';
    }

    if (lowerMessage.includes('invalid pdf') || lowerMessage.includes('malformed pdf')) {
      return 'Invalid PDF file. Please choose a valid PDF document.';
    }

    if (backendMessage) {
      return backendMessage;
    }

    return 'Ingestion failed. Please try again.';
  }

  private extractBackendMessage(errorPayload: unknown): string {
    if (!errorPayload) {
      return '';
    }

    if (typeof errorPayload === 'string') {
      return errorPayload;
    }

    if (typeof errorPayload === 'object') {
      const data = errorPayload as Record<string, unknown>;
      const candidate = data['message'] ?? data['error'] ?? data['detail'];
      if (typeof candidate === 'string') {
        return candidate;
      }
    }

    return '';
  }

  private extractChunkCount(response: unknown): number {
    if (!response || typeof response !== 'object') {
      return 0;
    }

    const data = response as Record<string, unknown>;
    const countCandidates = [
      data['chunk_count'],
      data['chunkCount'],
      data['chunks_count'],
      data['total_chunks'],
    ];

    for (const candidate of countCandidates) {
      if (typeof candidate === 'number' && Number.isFinite(candidate)) {
        return candidate;
      }
    }

    const chunks = data['chunks'];
    if (Array.isArray(chunks)) {
      return chunks.length;
    }

    return 0;
  }
}
