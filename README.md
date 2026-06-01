# Frontend Nedi (Angular)

Panel de instructor para Tututor.

## Desarrollo local

```bash
cd backup_front
npm install
ng serve
```

Por defecto usa la configuración **`dev`** (`environment.dev.ts` → API `https://dev.tututor.co/api`). Abre `http://localhost:4200/`.

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

### Nginx (SPA)

```nginx
location / {
    try_files $uri $uri/ /index.html;
}
```

El API no lo sirve este build: el front llama a `apiUrl` del environment (`/api` en el mismo dominio vía proxy en el servidor).

### Security Group

Puertos típicos: 22 (SSH), 80/443 (HTTP/HTTPS).

## Entornos

| Config | Archivo | API |
|--------|---------|-----|
| `dev` | `environment.dev.ts` | `https://dev.tututor.co/api` |
| `production` | `environment.ts` | `https://tututor.co/api` |

## Comandos útiles

- `ng test` — tests unitarios (Karma)
- `ng generate component nombre` — scaffolding
