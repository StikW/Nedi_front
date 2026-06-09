# Frontend Nedi (Angular)

Panel de instructor para Tututor.

## Desarrollo local (back en `localhost:3000`)

```bash
cd backup_front
npm install
npm start          # → http://localhost:4200 + API http://localhost:3000
```

Abre la consola del navegador y confirma: `[Nedi] API: http://localhost:3000`.

Para apuntar al servidor remoto de desarrollo:

```bash
npm run start:dev  # build dev con apiUrl /api (solo útil desplegado en el servidor)
```

Tras cambiar de entorno, borra la sesión guardada: `localStorage.removeItem('currentUser')` y vuelve a iniciar sesión.

Build manual:

```bash
ng build --configuration dev        # desarrollo
ng build --configuration production # producción
```

## Despliegue automático (GitHub Actions)

Workflow: `.github/workflows/deploy-ec2.yml`

- Rama **`develop`** → build con `--configuration dev` → despliega a EC2 (Nginx).
- Otros triggers según el workflow (`workflow_dispatch`).

### Secrets en GitHub

Settings → Secrets and variables → Actions:

| Secret | Descripción |
|--------|-------------|
| `EC2_HOST` | IP o hostname de la instancia |
| `EC2_USER` | Usuario SSH (`ubuntu`, `ec2-user`, …) |
| `EC2_SSH_KEY` | Clave privada PEM completa |
| `NGINX_PATH` | (Opcional) Ruta estáticos, default `/var/www/html` |

### Nginx (SPA + API)

```nginx
server_name tututor.co www.tututor.co;

location / {
    try_files $uri $uri/ /index.html;
}

location /api/ {
    proxy_pass http://127.0.0.1:3000/;
}
```

El front en producción usa `apiUrl: '/api'` (mismo origen en `tututor.co` y `www.tututor.co`).

### Security Group

Puertos típicos: 22 (SSH), 80/443 (HTTP/HTTPS).

## Entornos

| Config | Archivo | API |
|--------|---------|-----|
| `dev` | `environment.dev.ts` | `/api` (mismo dominio) |
| `production` | `environment.prod.ts` | `/api` (mismo dominio) |

## Comandos útiles

- `ng test` — tests unitarios (Karma)
- `ng generate component nombre` — scaffolding
