import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class LocalStorageService {

  saveData(key: string, value: string): void {
    localStorage.setItem(key, value);
  }

  saveDataSession(key: string, value: string): void {
    sessionStorage.setItem(key, value);
  }

  getData(key:string) :string | null {
    return localStorage.getItem(key);
  }

  removeData(key:string) {
    localStorage.removeItem(key);
  }

  removeSessionData(key:string) {
    sessionStorage.removeItem(key);
  }

  clearData() {
    localStorage.clear();
  }
}
