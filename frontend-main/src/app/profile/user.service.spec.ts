import { TestBed } from '@angular/core/testing';
import {
  HttpClientTestingModule,
  HttpTestingController,
} from '@angular/common/http/testing';
import { UserService } from './user.service';

describe('UserService', () => {
  let service: UserService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [UserService],
    });
    service = TestBed.inject(UserService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should get user by id', () => {
    const mockUser = { _id: '1', name: 'Test User', email: 'test@e.com' };
    service.getUserById('1').subscribe((user) => {
      expect(user).toEqual(mockUser as any);
    });
    const req = httpMock.expectOne((r) => r.url.includes('/users/1'));
    req.flush(mockUser);
  });

  it('should update user', () => {
    service.updateUser('1', { name: 'Updated' }).subscribe((user) => {
      expect(user.name).toBe('Updated');
    });
    const req = httpMock.expectOne(
      (r) => r.url.includes('/users/1') && r.method === 'PATCH',
    );
    req.flush({ _id: '1', name: 'Updated' });
  });

  it('should delete user by id', () => {
    service.deleteUserById('1').subscribe();
    const req = httpMock.expectOne(
      (r) => r.url.includes('/users/1') && r.method === 'DELETE',
    );
    req.flush(null);
  });
});
