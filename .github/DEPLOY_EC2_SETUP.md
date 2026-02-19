# Configuración de Despliegue en EC2 con Nginx

Este documento explica cómo configurar el despliegue automático de la aplicación Angular en un servidor EC2 con Nginx.

## Prerrequisitos

1. **Instancia EC2** con Nginx instalado y configurado
2. **Acceso SSH** a la instancia EC2 (clave privada)
3. **Permisos** para ejecutar comandos sudo en el servidor

## Configuración de Secrets en GitHub

Debes configurar los siguientes secrets en tu repositorio de GitHub:

1. Ve a **Settings** > **Secrets and variables** > **Actions**
2. Haz clic en **New repository secret**
3. Agrega los siguientes secrets:

### Secrets Requeridos

#### `EC2_HOST`
- **Descripción**: Dirección IP o dominio de tu instancia EC2
- **Ejemplo**: `ec2-12-34-56-78.compute-1.amazonaws.com` o `52.34.56.78`

#### `EC2_USER`
- **Descripción**: Usuario SSH para conectarse a la instancia
- **Ejemplo**: 
  - `ec2-user` (para Amazon Linux)
  - `ubuntu` (para Ubuntu)
  - `admin` (dependiendo de tu AMI)

#### `EC2_SSH_KEY`
- **Descripción**: Contenido completo de tu clave privada SSH (formato PEM)
- **Ejemplo**: 
  ```
  -----BEGIN RSA PRIVATE KEY-----
  MIIEpAIBAAKCAQEA...
  ...
  -----END RSA PRIVATE KEY-----
  ```

#### `NGINX_PATH` (Opcional)
- **Descripción**: Ruta donde se servirán los archivos estáticos en el servidor
- **Valor por defecto**: `/var/www/html`
- **Ejemplo**: `/var/www/html` o `/usr/share/nginx/html`

## Configuración de Nginx

Asegúrate de que Nginx esté configurado correctamente para servir la aplicación Angular. Aquí hay un ejemplo de configuración:

```nginx
server {
    listen 80;
    server_name tu-dominio.com www.tu-dominio.com;
    root /var/www/html;
    index index.html;

    # Configuración para Angular Router (SPA)
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Configuración de archivos estáticos
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Seguridad
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
}
```

## Configuración de Seguridad en EC2

### 1. Configurar Security Group

Asegúrate de que el Security Group de tu instancia EC2 permita:
- **SSH (Puerto 22)**: Solo desde tu IP o desde GitHub Actions (si usas GitHub-hosted runners)
- **HTTP (Puerto 80)**: Desde cualquier lugar (0.0.0.0/0)
- **HTTPS (Puerto 443)**: Desde cualquier lugar (si usas SSL)

### 2. Configurar Permisos SSH

Si necesitas restringir el acceso SSH, puedes:

1. Editar `/etc/ssh/sshd_config` en el servidor:
```bash
sudo nano /etc/ssh/sshd_config
```

2. Asegurarte de que el usuario tenga permisos sudo para operaciones de despliegue:
```bash
sudo visudo
# Agregar línea: usuario ALL=(ALL) NOPASSWD: /bin/systemctl reload nginx, /bin/service nginx reload
```

## Configuración del Workflow

El workflow se ejecutará automáticamente cuando:
- Haces push a las ramas `main`, `master` o `develop`
- Activación manual desde la pestaña Actions

## Verificación del Despliegue

Después de ejecutar el workflow:

1. Verifica que los archivos estén en el servidor:
```bash
ssh -i tu-clave.pem ec2-user@tu-ec2-host
ls -la /var/www/html
```

2. Verifica que Nginx esté funcionando:
```bash
sudo systemctl status nginx
```

3. Accede a tu aplicación en el navegador

## Troubleshooting

### Error: Permission denied (publickey)
- Verifica que `EC2_SSH_KEY` contenga la clave privada completa
- Asegúrate de que la clave tenga los permisos correctos (chmod 600)

### Error: nginx: command not found
- Instala Nginx en el servidor:
  - Amazon Linux: `sudo yum install nginx`
  - Ubuntu: `sudo apt-get install nginx`

### Error: Permission denied al copiar archivos
- Verifica que el usuario tenga permisos sudo
- Verifica que la ruta de Nginx sea correcta

### Los cambios no se reflejan
- Verifica que Nginx se haya recargado correctamente
- Limpia la caché del navegador
- Verifica los logs de Nginx: `sudo tail -f /var/log/nginx/error.log`

## Mejoras Futuras

- [ ] Implementar despliegue con Blue-Green
- [ ] Agregar notificaciones de despliegue (Slack, Email)
- [ ] Implementar rollback automático en caso de error
- [ ] Agregar tests antes del despliegue
- [ ] Configurar SSL/HTTPS con Let's Encrypt

