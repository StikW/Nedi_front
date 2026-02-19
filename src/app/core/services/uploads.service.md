# Servicio de Uploads - Recursos de Módulos

## Flujo de Subida de Recursos de Módulos

### 1. Creación de Módulo con Recursos

El flujo para crear un módulo con recursos es el siguiente:

1. **Crear el módulo** - Se crea el módulo sin recursos inicialmente
2. **Subir archivos** - Se obtienen URLs pre-firmadas y se suben los archivos a S3
3. **Actualizar módulo** - Se actualiza el módulo con las URLs de los recursos

### 2. Endpoints Utilizados

#### Para Recursos de Módulos:
- `POST /uploads/module/presigned-url` - Obtener URL pre-firmada para recursos de módulos
- `PUT {presignedUrl}` - Subir archivo directamente a S3
- `GET /uploads/module/{courseId}/{moduleId}/{fileKey}` - Descargar archivo de módulo
- `PUT /courses/{courseId}/modules/{moduleId}` - Actualizar módulo con recursos

### 3. Estructura de Datos

#### ModuleResource:
```typescript
interface ModuleResource {
  name: string;      // Nombre del archivo
  url: string;       // URL o identificador del archivo en S3
  size?: number;     // Tamaño del archivo en bytes
}
```

#### Module (actualizado):
```typescript
interface Module {
  id: number;
  order: number;
  status: ModuleStatus;
  title: string;
  description: string;
  resources?: ModuleResource[];  // Array de recursos del módulo
}
```

### 4. Métodos del Servicio

#### getModulePresignedUrl(courseId, moduleId, filename, contentType)
Obtiene una URL pre-firmada específica para recursos de módulos.

#### uploadModuleFileWithPresignedUrl(courseId, moduleId, file)
Método completo que obtiene la URL pre-firmada y sube el archivo.

#### downloadModuleFile(courseId, moduleId, fileKey)
Obtiene la URL de descarga de un archivo de módulo a través del endpoint del backend.

**Parámetros:**
- `courseId`: ID del curso
- `moduleId`: ID del módulo
- `fileKey`: Clave del archivo en S3

**Retorna:** `Observable<{ downloadUrl: string }>`

**Respuesta del endpoint:**
```typescript
{
  downloadUrl: string; // URL pre-firmada de S3 para descarga directa
}
```

### 5. Ejemplo de Uso

```typescript
// En el componente de detalles del curso
handleModuleSubmit(moduleData: ModuleFormData) {
  // 1. Crear módulo
  this.coursesService.createModule(courseId, moduleFormData)
    .subscribe(newModule => {
      // 2. Si hay archivos, subirlos
      if (moduleData.files?.length > 0) {
        this.uploadModuleResources(newModule.id, moduleData.files);
      }
    });
}

private uploadModuleResources(moduleId: number, files: File[]) {
  // Subir múltiples archivos en paralelo
  const uploadObservables = files.map(file => 
    this.uploadsService.uploadModuleFileWithPresignedUrl(courseId, moduleId, file)
  );

  forkJoin(uploadObservables).subscribe(uploadResults => {
    // Crear recursos con las URLs de los archivos subidos
    const resources: ModuleResource[] = uploadResults.map((result, index) => ({
      name: files[index].name,
      url: result.fileKey || '',
      size: files[index].size
    }));

    // Actualizar módulo con recursos
    this.updateModuleWithResources(moduleId, resources);
  });
}
```

### 6. Diferencias con Recursos de Cursos

- **Endpoint específico**: `/uploads/module/presigned-url` vs `/uploads/presigned-url`
- **Parámetros**: `courseId` y `moduleId` vs solo `courseId`
- **Estructura**: Los recursos se almacenan en el módulo, no en el curso
- **Escopo**: Los recursos están limitados al módulo específico
- **Descarga segura**: Las descargas se realizan a través del backend en lugar de acceso directo a S3

### 7. Consideraciones de Seguridad

- Las URLs pre-firmadas tienen tiempo de expiración
- Solo usuarios autenticados pueden obtener URLs pre-firmadas
- Los archivos se validan en el backend antes de la subida
- Los recursos están asociados a módulos específicos para control de acceso
- Las descargas se realizan a través del backend para control de acceso y auditoría
- Se requiere autenticación para todas las operaciones de archivos
