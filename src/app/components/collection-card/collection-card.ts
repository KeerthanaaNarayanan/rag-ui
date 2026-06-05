import { DatePipe } from '@angular/common';
import { Component, EventEmitter, Input, Output, signal } from '@angular/core';

export interface CollectionCardInputs {
  source: string;
  chunkCount: number | null;
  ingestedAt: string | Date | null;
}

@Component({
  selector: 'app-collection-card',
  imports: [DatePipe],
  templateUrl: './collection-card.html',
  styleUrl: './collection-card.css',
})
export class CollectionCard {
  @Input({ required: true }) source!: string;
  @Input() chunkCount: number | null = null;
  @Input() ingestedAt: string | Date | null = null;

  readonly showConfirm = signal(false);

  @Output() deleted = new EventEmitter<string>();

  startDelete(): void {
    this.showConfirm.set(true);
  }

  cancelDelete(): void {
    this.showConfirm.set(false);
  }

  confirmDelete(): void {
    this.deleted.emit(this.source);
    this.showConfirm.set(false);
  }
}
