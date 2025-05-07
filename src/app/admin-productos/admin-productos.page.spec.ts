import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AdminProductosPage } from './admin-productos.page';

describe('AdminProductosPage', () => {
  let component: AdminProductosPage;
  let fixture: ComponentFixture<AdminProductosPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(AdminProductosPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
