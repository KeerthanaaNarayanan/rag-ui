import { Component, OnInit, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { finalize } from 'rxjs';
import { RagApiService } from '../../services/rag-api';
import { CollectionCard } from '../../components/collection-card/collection-card';
import { ToastService } from '../../services/toast.service';

export interface CollectionItem {
  source: string;
  description: string | null;
  chunkCount: number | null;
  ingestedAt: string | Date | null;
}

@Component({
  selector: 'app-collections',
  imports: [CollectionCard],
  templateUrl: './collections.html',
  styleUrl: './collections.css',
})
export class Collections implements OnInit {
  readonly collections = signal<CollectionItem[]>([]);
  readonly isLoading = signal(true);

  constructor(
    private readonly ragApiService: RagApiService,
    private readonly toastService: ToastService
  ) {}

  ngOnInit(): void {
    this.ragApiService
      .getCollections()
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (response) => {
          const collections = this.normalizeCollections(response);
          this.collections.set(collections);
          this.toastService.show(`Loaded ${collections.length} collections.`, 'info');
        },
        error: (error: HttpErrorResponse) => {
          this.collections.set([]);
          const message = this.extractBackendMessage(error.error) || 'Failed to load collections.';
          this.toastService.show(message, 'error');
        },
      });
  }

  private normalizeCollections(response: unknown): CollectionItem[] {
    const rawCollections = this.extractArray(response);
    return rawCollections
      .map((item, index) => this.normalizeCollectionItem(item, index))
      .filter((item): item is CollectionItem => item !== null);
  }

  private extractArray(response: unknown): unknown[] {
    if (Array.isArray(response)) {
      return response;
    }

    if (response && typeof response === 'object') {
      const payload = response as Record<string, unknown>;
      const candidate = payload['collections'] ?? payload['items'] ?? payload['data'];
      if (Array.isArray(candidate)) {
        return candidate;
      }
    }

    return [];
  }

  private normalizeCollectionItem(item: unknown, index: number): CollectionItem | null {
    if (typeof item === 'string') {
      return {
        source: item,
        description: null,
        chunkCount: null,
        ingestedAt: null,
      };
    }

    if (!item || typeof item !== 'object') {
      return null;
    }

    const data = item as Record<string, unknown>;
    const source = this.pickString(data['name']) ?? this.pickString(data['title']) ?? this.pickString(data['collection']) ?? `Collection ${index + 1}`;
    const description = this.pickString(data['description']) ?? this.pickString(data['summary']) ?? null;
    const chunkCount = this.pickNumber(data['document_count']) ?? this.pickNumber(data['documents']) ?? this.pickNumber(data['count']) ?? this.pickNumber(data['chunk_count']) ?? null;
    const ingestedAt = this.pickDate(data['ingestedAt']) ?? this.pickDate(data['ingested_at']) ?? this.pickDate(data['createdAt']) ?? this.pickDate(data['created_at']) ?? null;

    return {
      source,
      description,
      chunkCount,
      ingestedAt,
    };
  }

  private pickString(value: unknown): string | null {
    if (typeof value !== 'string') {
      return null;
    }

    const trimmed = value.trim();
    return trimmed.length ? trimmed : null;
  }

  private pickNumber(value: unknown): number | null {
    if (typeof value === 'number' && Number.isFinite(value)) {
      return value;
    }

    if (typeof value === 'string') {
      const parsed = Number(value);
      if (Number.isFinite(parsed)) {
        return parsed;
      }
    }

    return null;
  }

  private pickDate(value: unknown): string | Date | null {
    if (typeof value === 'string' && value.trim().length) {
      return value.trim();
    }

    if (value instanceof Date && !Number.isNaN(value.getTime())) {
      return value;
    }

    return null;
  }

  removeCollection(source: string): void {
    this.ragApiService.deleteSource(source).subscribe({
      next: () => {
        this.collections.update((items) => items.filter((item) => item.source !== source));
        this.toastService.show(`Deleted ${source}.`, 'success');
      },
      error: (error: HttpErrorResponse) => {
        const message = this.extractBackendMessage(error.error) || `Failed to delete ${source}.`;
        this.toastService.show(message, 'error');
      },
    });
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
}
