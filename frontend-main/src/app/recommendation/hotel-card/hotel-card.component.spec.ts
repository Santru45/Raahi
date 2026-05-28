import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';

import { HotelCardComponent } from './hotel-card.component';

describe('HotelCardComponent', () => {
  let component: HotelCardComponent;
  let fixture: ComponentFixture<HotelCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HotelCardComponent, RouterTestingModule],
    }).compileComponents();

    fixture = TestBed.createComponent(HotelCardComponent);
    component = fixture.componentInstance;
    component.item = { kind: 'hotel' };
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have item input set', () => {
    expect(component.item).toBeTruthy();
    expect(component.item.kind).toBe('hotel');
  });

  it('should navigate to hotel detail on viewdetail', () => {
    spyOn(component.router, 'navigate');
    const hotel = { id: 'h1', _id: 'h1' } as any;
    component.viewdetail(hotel);
    expect(component.router.navigate).toHaveBeenCalledWith(['/hotel', 'h1']);
  });

  it('should prefer id over _id for hotel navigation', () => {
    spyOn(component.router, 'navigate');
    const hotel = { id: 'custom-id', _id: 'mongo-id' } as any;
    component.viewdetail(hotel);
    expect(component.router.navigate).toHaveBeenCalledWith([
      '/hotel',
      'custom-id',
    ]);
  });

  it('should navigate to offer detail on grabdeal', () => {
    spyOn(component.router, 'navigate').and.returnValue(Promise.resolve(true));
    const offer = { id: 'o1', _id: 'o1' } as any;
    component.grabdeal(offer);
    expect(component.router.navigate).toHaveBeenCalledWith([
      '/recommendation/offer',
      'o1',
    ]);
  });
});
