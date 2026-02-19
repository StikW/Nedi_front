# Página de Perfil de Usuario

## Descripción
La página de perfil permite a los usuarios ver y editar su información personal, profesional y de cuenta.

## Características

### 📝 Información Personal
- **Nombre Completo**: Campo requerido con validación de longitud mínima
- **Correo Electrónico**: Campo requerido con validación de email
- **Teléfono**: Campo opcional con validación de formato

### 💼 Información Profesional
- **Empresa**: Campo opcional para el nombre de la empresa
- **Cargo**: Campo opcional para la posición laboral

### 📖 Biografía
- **Descripción Personal**: Campo opcional con límite de 500 caracteres
- **Contador de Caracteres**: Muestra el progreso en tiempo real

### 🔧 Funcionalidades
- **Modo Edición**: Botón para alternar entre vista y edición
- **Validación en Tiempo Real**: Mensajes de error para campos inválidos
- **Formulario Reactivo**: Uso de ReactiveFormsModule para manejo de estado
- **Persistencia**: Los datos se mantienen en el AuthService

## Estructura del Componente

### Archivos
- `profile.component.ts` - Lógica del componente
- `profile.component.html` - Template HTML
- `profile.component.css` - Estilos CSS
- `profile.component.spec.ts` - Pruebas unitarias

### Dependencias
- `ReactiveFormsModule` - Para formularios reactivos
- `AuthService` - Para datos del usuario actual
- `User` - Modelo de datos del usuario

## Rutas

### Configuración
```typescript
{
  path: 'profile',
  loadComponent: () => import('./pages/profile/profile.component').then(m => m.ProfileComponent),
  canActivate: [AuthGuard]
}
```

### Acceso
- **URL**: `/profile`
- **Protección**: Requiere autenticación (AuthGuard)
- **Navegación**: Desde el menú desplegable del navbar

## Diseño Responsive

### Breakpoints
- **Desktop**: Layout de dos columnas (formulario + sidebar)
- **Tablet**: Layout de una columna con sidebar arriba
- **Móvil**: Layout vertical optimizado para pantallas pequeñas

### Características Móviles
- Botones de ancho completo en pantallas pequeñas
- Formulario apilado verticalmente
- Sidebar reorganizado para mejor usabilidad

## Validaciones

### Campos Requeridos
- Nombre completo (mínimo 2 caracteres)
- Correo electrónico (formato válido)

### Campos Opcionales
- Teléfono (formato internacional)
- Empresa
- Cargo
- Biografía (máximo 500 caracteres)

### Mensajes de Error
- Todos los mensajes están en español latino
- Validación en tiempo real
- Indicadores visuales para campos con error

## Estado del Formulario

### Modos
- **Vista**: Campos de solo lectura
- **Edición**: Campos editables con validación

### Transiciones
- Botón "Editar" → Activa modo edición
- Botón "Cancelar" → Desactiva edición y restaura valores
- Botón "Guardar" → Procesa cambios y desactiva edición

## Integración con el Sistema

### Servicios
- **AuthService**: Proporciona datos del usuario actual
- **Router**: Para navegación entre páginas

### Modelos
- **User**: Interfaz expandida con propiedades adicionales
- **FormGroup**: Formulario reactivo con validaciones

### Guardias
- **AuthGuard**: Protege la ruta para usuarios autenticados

## Próximas Mejoras

### Funcionalidades Planificadas
- [ ] Cambio de contraseña
- [ ] Preferencias de usuario
- [ ] Subida de avatar
- [ ] Notificaciones de éxito/error
- [ ] Historial de cambios

### Optimizaciones
- [ ] Lazy loading de componentes
- [ ] Cache de datos del usuario
- [ ] Validación del lado del servidor
- [ ] Sincronización en tiempo real
