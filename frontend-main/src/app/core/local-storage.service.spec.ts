import { TestBed } from '@angular/core/testing';
import { LocalStorageService } from './local-storage.service';

describe('LocalStorageService', () => {
  let service: LocalStorageService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(LocalStorageService);
    localStorage.clear();
    sessionStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  // ── localStorage ──────────────────────────────────────────────────────────
  it('should save data to localStorage', () => {
    service.saveData('testKey', 'testValue');
    expect(localStorage.getItem('testKey')).toBe('testValue');
  });

  it('should get data from localStorage', () => {
    localStorage.setItem('key1', 'value1');
    expect(service.getData('key1')).toBe('value1');
  });

  it('should return null for non-existent key', () => {
    expect(service.getData('nonExistent')).toBeNull();
  });

  it('should remove data from localStorage', () => {
    localStorage.setItem('rmKey', 'val');
    service.removeData('rmKey');
    expect(localStorage.getItem('rmKey')).toBeNull();
  });

  it('should clear all localStorage data', () => {
    localStorage.setItem('a', '1');
    localStorage.setItem('b', '2');
    service.clearData();
    expect(localStorage.length).toBe(0);
  });

  // ── sessionStorage ────────────────────────────────────────────────────────
  it('should save data to sessionStorage', () => {
    service.saveDataSession('sessKey', 'sessVal');
    expect(sessionStorage.getItem('sessKey')).toBe('sessVal');
  });

  it('should remove data from sessionStorage', () => {
    sessionStorage.setItem('sessKey', 'sessVal');
    service.removeSessionData('sessKey');
    expect(sessionStorage.getItem('sessKey')).toBeNull();
  });
});
