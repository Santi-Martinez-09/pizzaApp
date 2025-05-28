import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AdminPedidosPage } from './admin-pedidos.page';

describe('AdminPedidosPage', () => {
  let component: AdminPedidosPage;
  let fixture: ComponentFixture<AdminPedidosPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(AdminPedidosPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
