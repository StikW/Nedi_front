# Module Modal Component

Un componente modal reutilizable y versátil para crear y editar módulos de cursos, con un diseño moderno y funcionalidad completa.

## Características

- 🎨 **Diseño moderno** con animaciones suaves
- 📱 **Completamente responsive** para todos los dispositivos
- ♿ **Accesible** con navegación por teclado y estados de focus
- ⚡ **Estados de carga** con indicadores visuales
- 📁 **Subida de archivos** múltiples con vista previa
- ✅ **Validación de formularios** en tiempo real
- 🔧 **Altamente configurable** con inputs y outputs
- 🔄 **Modo dual** para crear y editar módulos
- 🎯 **Configuración dinámica** de textos y botones

## Uso

### Importación

```typescript
import { ModuleModalComponent, ModuleFormData } from './components/module-modal/module-modal.component';
```

### En el template

#### Modo Crear (por defecto)
```html
<app-module-modal
  [isOpen]="showModuleModal"
  [isLoading]="isSubmitting"
  mode="create"
  (closeModal)="closeModuleModal()"
  (submitModule)="handleModuleSubmit($event)">
</app-module-modal>
```

#### Modo Editar
```html
<app-module-modal
  [isOpen]="showEditModal"
  [isLoading]="isUpdating"
  mode="edit"
  [module]="selectedModule"
  (closeModal)="closeEditModal()"
  (submitModule)="handleModuleUpdate($event)">
</app-module-modal>
```

## Inputs

| Propiedad | Tipo | Por defecto | Descripción |
|-----------|------|--------------|-------------|
| `isOpen` | `boolean` | `false` | Controla la visibilidad del modal |
| `isLoading` | `boolean` | `false` | Muestra estado de carga durante el envío |
| `mode` | `'create' \| 'edit'` | `'create'` | Define el modo de operación del modal |
| `module` | `Module?` | `undefined` | Datos del módulo a editar (requerido en modo edit) |

## Outputs

| Evento | Tipo | Descripción |
|--------|------|-------------|
| `closeModal` | `EventEmitter<void>` | Emitido cuando se cierra el modal |
| `submitModule` | `EventEmitter<ModuleFormData>` | Emitido cuando se envía el formulario |

## Estructura del Modelo ModuleFormData

```typescript
interface ModuleFormData {
  title: string;
  description: string;
  files?: File[];
}
```

## Configuración Dinámica

El componente ajusta automáticamente su configuración según el modo:

### Modo Crear
```typescript
{
  title: 'Agregar Nuevo Módulo',
  submitButtonText: 'Agregar Módulo',
  loadingButtonText: 'Agregando...'
}
```

### Modo Editar
```typescript
{
  title: 'Editar Módulo',
  submitButtonText: 'Actualizar Módulo',
  loadingButtonText: 'Actualizando...'
}
```

## Ejemplos de Uso

### Uso básico para crear módulos

```typescript
export class CourseDetailsComponent {
  showModuleModal = false;
  isSubmitting = false;

  openCreateModal() {
    this.showModuleModal = true;
  }

  closeModuleModal() {
    this.showModuleModal = false;
  }

  handleModuleSubmit(moduleData: ModuleFormData) {
    this.isSubmitting = true;
    
    this.coursesService.createModule(this.courseId, {
      title: moduleData.title,
      description: moduleData.description
    }).subscribe({
      next: (newModule) => {
        this.modules.push(newModule);
        this.closeModuleModal();
        this.isSubmitting = false;
      },
      error: (error) => {
        console.error('Error creando módulo:', error);
        this.isSubmitting = false;
      }
    });
  }
}
```

### Uso para editar módulos

```typescript
export class CourseDetailsComponent {
  showEditModal = false;
  isUpdating = false;
  selectedModule: Module | null = null;

  openEditModal(module: Module) {
    this.selectedModule = module;
    this.showEditModal = true;
  }

  closeEditModal() {
    this.showEditModal = false;
    this.selectedModule = null;
  }

  handleModuleUpdate(moduleData: ModuleFormData) {
    if (!this.selectedModule) return;
    
    this.isUpdating = true;
    
    this.coursesService.updateModule(
      this.courseId, 
      this.selectedModule.id, 
      {
        title: moduleData.title,
        description: moduleData.description
      }
    ).subscribe({
      next: (updatedModule) => {
        // Actualizar el módulo en la lista
        const index = this.modules.findIndex(m => m.id === updatedModule.id);
        if (index !== -1) {
          this.modules[index] = updatedModule;
        }
        this.closeEditModal();
        this.isUpdating = false;
      },
      error: (error) => {
        console.error('Error actualizando módulo:', error);
        this.isUpdating = false;
      }
    });
  }
}
```

### Uso combinado en el template

```html
<!-- Modal para crear -->
<app-module-modal
  [isOpen]="showModuleModal"
  [isLoading]="isSubmitting"
  mode="create"
  (closeModal)="closeModuleModal()"
  (submitModule)="handleModuleSubmit($event)">
</app-module-modal>

<!-- Modal para editar -->
<app-module-modal
  [isOpen]="showEditModal"
  [isLoading]="isUpdating"
  mode="edit"
  [module]="selectedModule"
  (closeModal)="closeEditModal()"
  (submitModule)="handleModuleUpdate($event)">
</app-module-modal>
```

## Métodos Públicos

### `resetFormData()`
Resetea el formulario a su estado inicial.

```typescript
// Desde el componente padre
@ViewChild(ModuleModalComponent) moduleModal!: ModuleModalComponent;

resetModalForm() {
  this.moduleModal.resetFormData();
}
```

### `initializeWithModule(module: Module)`
Inicializa el modal con datos de un módulo específico.

```typescript
@ViewChild(ModuleModalComponent) moduleModal!: ModuleModalComponent;

openEditModal(module: Module) {
  this.moduleModal.initializeWithModule(module);
  this.showEditModal = true;
}
```

## Estilos y Personalización

El componente incluye:

- **Variables CSS personalizables** para colores y espaciado
- **Breakpoints responsive** para móvil, tablet y desktop
- **Estados de hover y focus** para mejor UX
- **Animaciones CSS** para transiciones suaves
- **Estados de carga** con spinners animados

### Personalización de colores

El componente utiliza la línea de colores del sistema de diseño del proyecto:

```css
:root {
  --modal-primary-color: #2563eb;
  --modal-secondary-color: #7c3aed;
  --modal-background: #ffffff;
  --modal-border-color: #e2e8f0;
  --modal-text-primary: #1e293b;
  --modal-text-muted: #64748b;
  --modal-bg-light: #f8fafc;
}
```

## Accesibilidad

- ✅ **Navegación por teclado** con estados de focus visibles
- ✅ **Roles ARIA** apropiados para elementos interactivos
- ✅ **Contraste de colores** que cumple con estándares WCAG
- ✅ **Textos alternativos** para iconos y elementos visuales
- ✅ **Estados disabled** apropiados durante la carga

## Validaciones

El componente incluye validaciones automáticas:

- **Título requerido** - No se puede enviar sin título
- **Descripción requerida** - No se puede enviar sin descripción
- **Estados de carga** - Deshabilita el formulario durante el envío
- **Validación de archivos** - Manejo seguro de archivos seleccionados

## Testing

El componente incluye pruebas unitarias completas que cubren:

- Renderizado correcto del modal
- Estados de apertura/cierre
- Emisión de eventos
- Validaciones de formulario
- Manejo de archivos
- Estados de carga
- Interacciones de usuario
- Configuración dinámica por modo
- Métodos públicos

Para ejecutar las pruebas:

```bash
ng test module-modal.component.spec.ts
```

## Dependencias

- Angular Core
- CommonModule para directivas básicas
- FormsModule para formularios reactivos
- No requiere dependencias externas

## Compatibilidad

- ✅ Angular 17+
- ✅ Navegadores modernos (Chrome, Firefox, Safari, Edge)
- ✅ Soporte para dispositivos móviles y tablets
- ✅ Soporte para subida de archivos múltiples

## Animaciones

El modal incluye animaciones suaves:

- **Fade in/out** para el overlay
- **Slide up** para el contenido del modal
- **Hover effects** en botones e inputs
- **Loading spinner** para estados de carga

## Responsive Design

El componente se adapta automáticamente a diferentes tamaños de pantalla:

- **Desktop**: Layout horizontal con botones lado a lado
- **Tablet**: Layout vertical con botones apilados
- **Mobile**: Layout optimizado para pantallas pequeñas

## Migración desde add-module-modal

Si estás migrando desde el componente anterior:

1. **Cambiar la importación:**
   ```typescript
   // Antes
   import { AddModuleModalComponent, ModuleFormData } from './components/add-module-modal/add-module-modal.component';
   
   // Después
   import { ModuleModalComponent, ModuleFormData } from './components/module-modal/module-modal.component';
   ```

2. **Actualizar el selector en el template:**
   ```html
   <!-- Antes -->
   <app-add-module-modal>
   
   <!-- Después -->
   <app-module-modal>
   ```

3. **Agregar el modo si es necesario:**
   ```html
   <app-module-modal
     [isOpen]="showModuleModal"
     [isLoading]="isSubmitting"
     mode="create"  <!-- Opcional, es el valor por defecto -->
     (closeModal)="closeModuleModal()"
     (submitModule)="handleModuleSubmit($event)">
   </app-module-modal>
   ```
