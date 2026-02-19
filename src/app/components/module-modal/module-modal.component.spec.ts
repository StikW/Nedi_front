import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { ModuleModalComponent, ModuleFormData } from './module-modal.component';
import { Module } from '../../models/module.model';

describe('ModuleModalComponent', () => {
  let component: ModuleModalComponent;
  let fixture: ComponentFixture<ModuleModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ModuleModalComponent, FormsModule]
    }).compileComponents();

    fixture = TestBed.createComponent(ModuleModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should not display modal when isOpen is false', () => {
    component.isOpen = false;
    fixture.detectChanges();
    
    const modal = fixture.nativeElement.querySelector('.modal');
    expect(modal).toBeNull();
  });

  it('should display modal when isOpen is true', () => {
    component.isOpen = true;
    fixture.detectChanges();
    
    const modal = fixture.nativeElement.querySelector('.modal');
    expect(modal).toBeTruthy();
  });

  it('should emit closeModal when close button is clicked', () => {
    component.isOpen = true;
    fixture.detectChanges();
    
    spyOn(component.closeModal, 'emit');
    const closeButton = fixture.nativeElement.querySelector('.btn-icon');
    closeButton.click();
    
    expect(component.closeModal.emit).toHaveBeenCalled();
  });

  it('should emit submitModule with form data when form is submitted', () => {
    component.isOpen = true;
    component.moduleData = {
      title: 'Test Module',
      description: 'Test Description',
      files: []
    };
    fixture.detectChanges();
    
    spyOn(component.submitModule, 'emit');
    const form = fixture.nativeElement.querySelector('form');
    form.dispatchEvent(new Event('submit'));
    
    expect(component.submitModule.emit).toHaveBeenCalledWith({
      title: 'Test Module',
      description: 'Test Description',
      files: []
    });
  });

  it('should not submit when title is empty', () => {
    component.isOpen = true;
    component.moduleData = {
      title: '',
      description: 'Test Description',
      files: []
    };
    fixture.detectChanges();
    
    spyOn(component.submitModule, 'emit');
    const form = fixture.nativeElement.querySelector('form');
    form.dispatchEvent(new Event('submit'));
    
    expect(component.submitModule.emit).not.toHaveBeenCalled();
  });

  it('should not submit when description is empty', () => {
    component.isOpen = true;
    component.moduleData = {
      title: 'Test Module',
      description: '',
      files: []
    };
    fixture.detectChanges();
    
    spyOn(component.submitModule, 'emit');
    const form = fixture.nativeElement.querySelector('form');
    form.dispatchEvent(new Event('submit'));
    
    expect(component.submitModule.emit).not.toHaveBeenCalled();
  });

  it('should handle file selection', () => {
    component.isOpen = true;
    fixture.detectChanges();
    
    const mockFile = new File(['test'], 'test.pdf', { type: 'application/pdf' });
    const mockEvent = {
      target: {
        files: [mockFile]
      }
    } as any;
    
    component.onFileSelected(mockEvent);
    
    expect(component.selectedFiles).toContain(mockFile);
    expect(component.moduleData.files).toContain(mockFile);
  });

  it('should reset form when modal is closed', () => {
    component.isOpen = true;
    component.moduleData = {
      title: 'Test Module',
      description: 'Test Description',
      files: [new File(['test'], 'test.pdf')]
    };
    component.selectedFiles = [new File(['test'], 'test.pdf')];
    fixture.detectChanges();
    
    component.onClose();
    
    expect(component.moduleData.title).toBe('');
    expect(component.moduleData.description).toBe('');
    expect(component.moduleData.files).toEqual([]);
    expect(component.selectedFiles).toEqual([]);
  });

  it('should disable form when isLoading is true', () => {
    component.isOpen = true;
    component.isLoading = true;
    fixture.detectChanges();
    
    const inputs = fixture.nativeElement.querySelectorAll('input, textarea');
    const buttons = fixture.nativeElement.querySelectorAll('button');
    
    inputs.forEach((input: HTMLInputElement) => {
      expect(input.disabled).toBe(true);
    });
    
    buttons.forEach((button: HTMLButtonElement) => {
      expect(button.disabled).toBe(true);
    });
  });

  it('should show loading state in submit button when isLoading is true', () => {
    component.isOpen = true;
    component.isLoading = true;
    fixture.detectChanges();
    
    const submitButton = fixture.nativeElement.querySelector('button[type="submit"]');
    expect(submitButton.textContent).toContain('Agregando...');
  });

  it('should show selected files count', () => {
    component.isOpen = true;
    component.selectedFiles = [
      new File(['test1'], 'test1.pdf'),
      new File(['test2'], 'test2.pdf')
    ];
    fixture.detectChanges();
    
    const fileCount = fixture.nativeElement.querySelector('.file-name');
    expect(fileCount.textContent).toContain('2 archivo(s) seleccionado(s)');
  });

  it('should display selected files list', () => {
    component.isOpen = true;
    component.selectedFiles = [
      new File(['test1'], 'test1.pdf'),
      new File(['test2'], 'test2.pdf')
    ];
    fixture.detectChanges();
    
    const filesList = fixture.nativeElement.querySelectorAll('.selected-files li');
    expect(filesList.length).toBe(2);
    expect(filesList[0].textContent).toContain('test1.pdf');
    expect(filesList[1].textContent).toContain('test2.pdf');
  });

  describe('Modal Configuration', () => {
    it('should show create configuration by default', () => {
      expect(component.modalConfig.title).toBe('Agregar Nuevo Módulo');
      expect(component.modalConfig.submitButtonText).toBe('Agregar Módulo');
      expect(component.modalConfig.loadingButtonText).toBe('Agregando...');
    });

    it('should show edit configuration when mode is edit', () => {
      component.mode = 'edit';
      component.ngOnChanges({ mode: { currentValue: 'edit', previousValue: 'create', firstChange: false, isFirstChange: () => false } });
      
      expect(component.modalConfig.title).toBe('Editar Módulo');
      expect(component.modalConfig.submitButtonText).toBe('Actualizar Módulo');
      expect(component.modalConfig.loadingButtonText).toBe('Actualizando...');
    });

    it('should initialize form data with module data when in edit mode', () => {
      const mockModule: Module = {
        id: 1,
        title: 'Test Module',
        description: 'Test Description'
      };

      component.mode = 'edit';
      component.module = mockModule;
      component.ngOnChanges({ 
        mode: { currentValue: 'edit', previousValue: 'create', firstChange: false, isFirstChange: () => false },
        module: { currentValue: mockModule, previousValue: undefined, firstChange: false, isFirstChange: () => false }
      });

      expect(component.moduleData.title).toBe('Test Module');
      expect(component.moduleData.description).toBe('Test Description');
    });

    it('should reset form data when switching from edit to create mode', () => {
      const mockModule: Module = {
        id: 1,
        title: 'Test Module',
        description: 'Test Description'
      };

      component.mode = 'edit';
      component.module = mockModule;
      component.ngOnChanges({ 
        mode: { currentValue: 'edit', previousValue: 'create', firstChange: false, isFirstChange: () => false },
        module: { currentValue: mockModule, previousValue: undefined, firstChange: false, isFirstChange: () => false }
      });

      component.mode = 'create';
      component.module = undefined;
      component.ngOnChanges({ 
        mode: { currentValue: 'create', previousValue: 'edit', firstChange: false, isFirstChange: () => false },
        module: { currentValue: undefined, previousValue: mockModule, firstChange: false, isFirstChange: () => false }
      });

      expect(component.moduleData.title).toBe('');
      expect(component.moduleData.description).toBe('');
    });
  });

  describe('Public Methods', () => {
    it('should reset form data when resetFormData is called', () => {
      component.moduleData = {
        title: 'Test Module',
        description: 'Test Description',
        files: [new File(['test'], 'test.pdf')]
      };
      component.selectedFiles = [new File(['test'], 'test.pdf')];

      component.resetFormData();

      expect(component.moduleData.title).toBe('');
      expect(component.moduleData.description).toBe('');
      expect(component.moduleData.files).toEqual([]);
      expect(component.selectedFiles).toEqual([]);
    });

    it('should initialize with module when initializeWithModule is called', () => {
      const mockModule: Module = {
        id: 1,
        title: 'Test Module',
        description: 'Test Description'
      };

      component.initializeWithModule(mockModule);

      expect(component.module).toBe(mockModule);
      expect(component.moduleData.title).toBe('Test Module');
      expect(component.moduleData.description).toBe('Test Description');
    });
  });
});
