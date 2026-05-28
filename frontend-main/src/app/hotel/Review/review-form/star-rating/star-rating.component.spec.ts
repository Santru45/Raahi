import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StarRatingComponent } from './star-rating.component';

describe('StarRatingComponent', () => {
  let component: StarRatingComponent;
  let fixture: ComponentFixture<StarRatingComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StarRatingComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(StarRatingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have stars array [1,2,3,4,5]', () => {
    expect(component.stars).toEqual([1, 2, 3, 4, 5]);
  });

  it('should have 0 selected initially', () => {
    expect(component.selected).toBe(0);
  });

  it('should have 0 hover initially', () => {
    expect(component.hover).toBe(0);
  });

  it('should compute floor correctly', () => {
    expect(component.floor(3.7)).toBe(3);
    expect(component.floor(5)).toBe(5);
  });

  it('should compute ceil correctly', () => {
    expect(component.ceil(3.2)).toBe(4);
    expect(component.ceil(5)).toBe(5);
  });

  it('should emit rated event on click', () => {
    spyOn(component.rated, 'emit');
    const el = document.createElement('span');
    el.style.width = '20px';
    el.style.display = 'inline-block';
    document.body.appendChild(el);

    const rect = el.getBoundingClientRect();
    // Click on the right half — full star
    const event = new MouseEvent('click', {
      clientX: rect.left + rect.width * 0.8,
    });
    Object.defineProperty(event, 'target', { value: el });
    component.onClick(4, event);

    expect(component.rated.emit).toHaveBeenCalled();
    expect(component.selected).toBeGreaterThan(0);
    document.body.removeChild(el);
  });
});
