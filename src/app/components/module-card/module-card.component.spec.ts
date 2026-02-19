import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ModuleCardComponent } from './module-card.component';
import { Module } from '../../models/module.model';

describe('ModuleCardComponent', () => {
  let component: ModuleCardComponent;
  let fixture: ComponentFixture<ModuleCardComponent>;

  const mockModule: Module = {
    id: 1,
    title: 'Test Module',
    description: 'This is a test module description'
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ModuleCardComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(ModuleCardComponent);
    component = fixture.componentInstance;
    component.module = mockModule;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display module title', () => {
    const titleElement = fixture.nativeElement.querySelector('h3');
    expect(titleElement.textContent).toContain('Test Module');
  });

  it('should display module description', () => {
    const descriptionElement = fixture.nativeElement.querySelector('.module-description');
    expect(descriptionElement.textContent).toContain('This is a test module description');
  });

  it('should display module ID', () => {
    const idElement = fixture.nativeElement.querySelector('.module-id');
    expect(idElement.textContent).toContain('#1');
  });

  it('should emit editModule event when edit button is clicked', () => {
    spyOn(component.editModule, 'emit');
    component.isEditable = true;
    fixture.detectChanges();

    const editButton = fixture.nativeElement.querySelector('.edit-btn');
    editButton.click();

    expect(component.editModule.emit).toHaveBeenCalledWith(mockModule);
  });

  it('should emit deleteModule event when delete button is clicked', () => {
    spyOn(component.deleteModule, 'emit');
    component.isEditable = true;
    fixture.detectChanges();

    const deleteButton = fixture.nativeElement.querySelector('.delete-btn');
    deleteButton.click();

    expect(component.deleteModule.emit).toHaveBeenCalledWith(1);
  });

  it('should emit viewModule event when card is clicked', () => {
    spyOn(component.viewModule, 'emit');
    
    const card = fixture.nativeElement.querySelector('.module-card');
    card.click();

    expect(component.viewModule.emit).toHaveBeenCalledWith(mockModule);
  });

  it('should not show action buttons when showActions is false', () => {
    component.showActions = false;
    fixture.detectChanges();

    const actionsElement = fixture.nativeElement.querySelector('.module-actions');
    expect(actionsElement).toBeFalsy();
  });

  it('should not show edit and delete buttons when isEditable is false', () => {
    component.isEditable = false;
    fixture.detectChanges();

    const editButton = fixture.nativeElement.querySelector('.edit-btn');
    const deleteButton = fixture.nativeElement.querySelector('.delete-btn');

    expect(editButton).toBeFalsy();
    expect(deleteButton).toBeFalsy();
  });

  it('should show action buttons when both showActions and isEditable are true', () => {
    component.showActions = true;
    component.isEditable = true;
    fixture.detectChanges();

    const editButton = fixture.nativeElement.querySelector('.edit-btn');
    const deleteButton = fixture.nativeElement.querySelector('.delete-btn');

    expect(editButton).toBeTruthy();
    expect(deleteButton).toBeTruthy();
  });

  it('should prevent event propagation on edit button click', () => {
    const mockEvent = new Event('click');
    spyOn(mockEvent, 'stopPropagation');
    
    component.onEdit(mockEvent);
    
    expect(mockEvent.stopPropagation).toHaveBeenCalled();
  });

  it('should prevent event propagation on delete button click', () => {
    const mockEvent = new Event('click');
    spyOn(mockEvent, 'stopPropagation');
    
    component.onDelete(mockEvent);
    
    expect(mockEvent.stopPropagation).toHaveBeenCalled();
  });

  it('should show confirmation dialog before deleting module', () => {
    spyOn(window, 'confirm').and.returnValue(true);
    spyOn(component.deleteModule, 'emit');
    
    component.onDelete(new Event('click'));
    
    expect(window.confirm).toHaveBeenCalledWith('¿Estás seguro de que quieres eliminar este módulo?');
    expect(component.deleteModule.emit).toHaveBeenCalledWith(1);
  });

  it('should not emit delete event when confirmation is cancelled', () => {
    spyOn(window, 'confirm').and.returnValue(false);
    spyOn(component.deleteModule, 'emit');
    
    component.onDelete(new Event('click'));
    
    expect(component.deleteModule.emit).not.toHaveBeenCalled();
  });
});
