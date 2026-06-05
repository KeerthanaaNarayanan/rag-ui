import { Component, ElementRef, ViewChild, signal } from '@angular/core';
import { animate, state, style, transition, trigger } from '@angular/animations';
import { FormsModule } from '@angular/forms';
import { RagApiService } from '../../services/rag-api';

export interface Source {
  filename: string;
  page: number | null;
  score: number | null;
  text: string;
}

export interface Message {
  role: 'user' | 'assistant';
  text: string;
  sources?: Source[];
}

@Component({
  selector: 'app-query',
  imports: [FormsModule],
  templateUrl: './query.html',
  styleUrl: './query.css',
  animations: [
    trigger('expand', [
      state('open', style({ height: '*', opacity: 1 })),
      state('closed', style({ height: '0px', opacity: 0 })),
      transition('open <=> closed', animate('200ms ease')),
    ]),
  ],
})
export class Query {
  readonly messages = signal<Message[]>([]);
  readonly isAssistantTyping = signal(false);
  readonly openSourcesByMessage = signal<Record<number, boolean>>({});
  readonly expandedChunks = signal<Record<string, boolean>>({});
  queryText = '';

  @ViewChild('messagesContainer')
  private messagesContainer?: ElementRef<HTMLElement>;

  constructor(private readonly ragApiService: RagApiService) {}

  sendQuery(): void {
    const prompt = this.queryText.trim();
    if (!prompt || this.isAssistantTyping()) {
      return;
    }

    this.messages.update((list) => [...list, { role: 'user', text: prompt }]);
    this.queryText = '';
    this.isAssistantTyping.set(true);
    this.scrollToBottom();

    this.ragApiService
      .query(prompt)
      .subscribe({
        next: (response) => {
          this.isAssistantTyping.set(false);
          this.messages.update((list) => [
            ...list,
            {
              role: 'assistant',
              text: this.extractAssistantAnswer(response),
              sources: this.extractSources(response),
            },
          ]);
          this.scrollToBottom();
        },
        error: () => {
          this.isAssistantTyping.set(false);
          this.messages.update((list) => [
            ...list,
            {
              role: 'assistant',
              text: 'I could not reach the API. Please verify the Flask server is running.',
            },
          ]);
          this.scrollToBottom();
        },
      });
  }

  private scrollToBottom(): void {
    queueMicrotask(() => {
      const container = this.messagesContainer?.nativeElement;
      if (!container) {
        return;
      }

      const lastMessage = container.lastElementChild as HTMLElement | null;
      lastMessage?.scrollIntoView({ behavior: 'smooth', block: 'end' });
    });
  }

  private extractAssistantAnswer(response: unknown): string {
    if (!response || typeof response !== 'object') {
      return 'No answer returned by the API.';
    }

    const payload = response as Record<string, unknown>;
    const candidate = payload['answer'] ?? payload['response'] ?? payload['result'] ?? payload['text'];
    if (typeof candidate === 'string' && candidate.trim().length > 0) {
      return candidate;
    }

    return 'The API returned an empty response.';
  }

  private extractSources(response: unknown): Source[] | undefined {
    if (!response || typeof response !== 'object') {
      return undefined;
    }

    const payload = response as Record<string, unknown>;
    const rawSources = payload['sources'];
    if (!Array.isArray(rawSources)) {
      return undefined;
    }

    const sources = rawSources
      .map((item) => {
        if (!item || typeof item !== 'object') {
          return null;
        }

        const source = item as Record<string, unknown>;
        const filename =
          this.pickString(source['filename']) ??
          this.pickString(source['file_name']) ??
          this.pickString(source['source']) ??
          this.pickString(source['title']) ??
          'Unknown source';

        const text =
          this.pickString(source['chunk_text']) ??
          this.pickString(source['snippet']) ??
          this.pickString(source['text']) ??
          '';

        const page =
          this.pickNumber(source['page']) ??
          this.pickNumber(source['page_number']) ??
          this.pickNumber(source['page_num']) ??
          null;

        const rawScore =
          this.pickNumber(source['score']) ??
          this.pickNumber(source['similarity']) ??
          this.pickNumber(source['similarity_score']) ??
          null;

        if (!text) {
          return null;
        }

        return {
          filename,
          page,
          score: rawScore,
          text,
        };
      })
      .filter((item): item is Source => item !== null);

    return sources.length ? sources : undefined;
  }

  toggleSources(messageIndex: number): void {
    this.openSourcesByMessage.update((state) => ({
      ...state,
      [messageIndex]: !state[messageIndex],
    }));
    this.scrollToBottom();
  }

  isSourcesOpen(messageIndex: number): boolean {
    return !!this.openSourcesByMessage()[messageIndex];
  }

  sourcePanelState(messageIndex: number): 'open' | 'closed' {
    return this.isSourcesOpen(messageIndex) ? 'open' : 'closed';
  }

  toggleChunk(messageIndex: number, sourceIndex: number): void {
    const key = this.chunkKey(messageIndex, sourceIndex);
    this.expandedChunks.update((state) => ({
      ...state,
      [key]: !state[key],
    }));
    this.scrollToBottom();
  }

  isChunkExpanded(messageIndex: number, sourceIndex: number): boolean {
    return !!this.expandedChunks()[this.chunkKey(messageIndex, sourceIndex)];
  }

  scorePercent(score: number | null): number {
    if (score === null || !Number.isFinite(score)) {
      return 0;
    }

    const normalized = score <= 1 ? score * 100 : score;
    return Math.max(0, Math.min(100, Math.round(normalized)));
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

  private chunkKey(messageIndex: number, sourceIndex: number): string {
    return `${messageIndex}:${sourceIndex}`;
  }
}
