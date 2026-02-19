# Module Card Component

Un componente reutilizable para mostrar información de módulos de cursos en un diseño de tarjeta atractivo y moderno.

## Características

- 🎨 **Diseño moderno** con gradientes y efectos de hover
- 📱 **Completamente responsive** para todos los dispositivos
- ♿ **Accesible** con estados de focus y navegación por teclado
- 🌙 **Soporte para modo oscuro** automático
- ⚡ **Animaciones suaves** y transiciones elegantes
- 🔧 **Altamente configurable** con inputs y outputs

## Uso

### Importación

```typescript
import { ModuleCardComponent } from './components/module-card/module-card.component';
```

### En el template

```html
<app-module-card
  [module]="moduleData"
  [showActions]="true"
  [isEditable]="true"
  (editModule)="onEditModule($event)"
  (deleteModule)="onDeleteModule($event)"
  (viewModule)="onViewModule($event)">
</app-module-card>
```

## Inputs

| Propiedad | Tipo | Por defecto | Descripción |
|-----------|------|--------------|-------------|
| `module` | `Module` | **Requerido** | Datos del módulo a mostrar |
| `showActions` | `boolean` | `true` | Mostrar/ocultar botones de acción |
| `isEditable` | `boolean` | `false` | Habilitar/deshabilitar edición |

## Outputs

| Evento | Tipo | Descripción |
|--------|------|-------------|
| `editModule` | `EventEmitter<Module>` | Emitido al hacer clic en el botón de editar |
| `deleteModule` | `EventEmitter<number>` | Emitido al confirmar eliminación |
| `viewModule` | `EventEmitter<Module>` | Emitido al hacer clic en la tarjeta |

## Estructura del Modelo Module

```typescript
interface Module {
  id: number;
  title: string;
  description: string;
}
```

## Ejemplos de Uso

### Tarjeta básica (solo lectura)

```html
<app-module-card
  [module]="module"
  [showActions]="false">
</app-module-card>
```

### Tarjeta editable para instructores

```html
<app-module-card
  [module]="module"
  [isEditable]="true"
  (editModule)="editModule($event)"
  (deleteModule)="deleteModule($event)">
</app-module-card>
```

### Con manejo de eventos personalizado

```html
<app-module-card
  [module]="module"
  [isEditable]="true"
  (editModule)="openEditModal($event)"
  (deleteModule)="confirmDelete($event)"
  (viewModule)="navigateToModule($event)">
</app-module-card>
```

## Estilos y Personalización

El componente incluye:

- **Variables CSS personalizables** para colores y espaciado
- **Soporte para modo oscuro** automático
- **Breakpoints responsive** para móvil, tablet y desktop
- **Estados de hover y focus** para mejor UX
- **Animaciones CSS** para transiciones suaves

### Personalización de colores

El componente utiliza la línea de colores del sistema de diseño del proyecto y **siempre mantiene el tema claro**:

```css
:root {
  --module-primary-color: #2563eb;
  --module-secondary-color: #7c3aed;
  --module-background: #ffffff;
  --module-border-color: #e2e8f0;
  --module-text-primary: #1e293b;
  --module-text-muted: #64748b;
  --module-bg-light: #f8fafc;
}
```

**Nota:** Las tarjetas de módulos siempre se muestran con colores claros, independientemente de las preferencias de tema del sistema operativo, para mantener consistencia visual en la aplicación.

## Accesibilidad

- ✅ **Navegación por teclado** con estados de focus visibles
- ✅ **Roles ARIA** apropiados para elementos interactivos
- ✅ **Contraste de colores** que cumple con estándares WCAG
- ✅ **Textos alternativos** para iconos y elementos visuales

## Testing

El componente incluye pruebas unitarias completas que cubren:

- Renderizado correcto de datos
- Emisión de eventos
- Estados condicionales
- Interacciones de usuario
- Manejo de eventos

Para ejecutar las pruebas:

```bash
ng test module-card.component.spec.ts
```

## Dependencias

- Angular Core
- CommonModule para directivas básicas
- No requiere dependencias externas

## Compatibilidad

- ✅ Angular 17+
- ✅ Navegadores modernos (Chrome, Firefox, Safari, Edge)
- ✅ Soporte para dispositivos móviles y tablets
- ✅ Modo oscuro automático según preferencias del sistema
