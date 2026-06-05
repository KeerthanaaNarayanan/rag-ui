import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class RagApi {
	readonly FLASK_API = 'http://localhost:5000';

	constructor(private readonly http: HttpClient) {}

	ingestText(payload: Record<string, unknown>): Observable<unknown> {
		return this.http.post<unknown>(`${this.FLASK_API}/ingest/text`, payload);
	}

	ingestFile(formData: FormData): Observable<unknown> {
		return this.http.post<unknown>(`${this.FLASK_API}/ingest/file`, formData);
	}

	query(payload: Record<string, unknown>): Observable<unknown> {
		return this.http.post<unknown>(`${this.FLASK_API}/query`, payload);
	}

	getCollections(): Observable<unknown> {
		return this.http.get<unknown>(`${this.FLASK_API}/collections`);
	}
}
