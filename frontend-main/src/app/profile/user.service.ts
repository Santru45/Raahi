import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { User } from '../core/user.model';
import { env } from '../../../.environment';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  private http = inject(HttpClient);
  private baseUrl = env.baseUrl + '/users';

  deleteUserById(id: string) {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }

  getUserById(id: string) {
    return this.http.get<User>(`${this.baseUrl}/${id}`);
  }

  updateUser(id: string, user: Partial<User>) {
    return this.http.patch<User>(`${this.baseUrl}/${id}`, user);
  }
}
