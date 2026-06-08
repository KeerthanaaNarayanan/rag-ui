import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class RagApiService {
	readonly FLASK_API = 'http://localhost:4000';

	constructor(private readonly http: HttpClient) {}

	ingestText(payload: Record<string, unknown>): Observable<unknown> {
		return this.http.post<unknown>(`${this.FLASK_API}/ingest`, payload);
	}

	ingestFile(formData: FormData): Observable<unknown> {
		return this.http.post<unknown>(`${this.FLASK_API}/ingest`, formData);
	}

	query(question: string): Observable<unknown> {
		return this.http.post<unknown>(`${this.FLASK_API}/query`, { question: question });
	}

	getCollections(): Observable<unknown> {
		return this.http.get<unknown>(`${this.FLASK_API}/collections`);
	}

	deleteSource(source: string): Observable<unknown> {
		return this.http.delete<unknown>(`${this.FLASK_API}/sources/${encodeURIComponent(source)}`);
	}
}
