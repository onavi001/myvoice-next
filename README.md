```markdown
# My Voice

![My Voice Logo](public/favicon.ico)

**My Voice** es una aplicación web diseñada para ayudarte a crear, seguir y optimizar tus rutinas de entrenamiento físico. Con un enfoque en la personalización y el seguimiento del progreso, esta herramienta es ideal para entusiastas del fitness que buscan llevar sus entrenamientos al siguiente nivel.

## Características

- **Autenticación de usuarios:** Registro e inicio de sesión seguros con JWT.
- **Gestión de rutinas:** Crea, edita y elimina rutinas personalizadas con días y ejercicios específicos.
- **Seguimiento de progreso:** Registra tu desempeño (series, repeticiones, peso) y visualiza tu progreso con gráficos.
- **Interfaz responsiva:** Diseñada con Tailwind CSS para una experiencia fluida en dispositivos móviles y de escritorio.
- **Integración con IA:** Genera rutinas automáticamente con soporte para prompts de IA (en desarrollo).
- **Base de datos MongoDB:** Almacenamiento persistente de usuarios, rutinas y progreso.

## Tecnologías utilizadas

- **Frontend:** Next.js, React, Redux Toolkit, TypeScript, Tailwind CSS, Framer Motion (animaciones).
- **Backend:** Next.js API Routes, MongoDB, Mongoose, JWT para autenticación.
- **Herramientas:** Chart.js (gráficos), ESLint, Prettier.

## Instalación

Sigue estos pasos para configurar y ejecutar el proyecto localmente.

### Prerrequisitos

- [Node.js](https://nodejs.org/) (v16 o superior)
- [MongoDB](https://www.mongodb.com/) (local o en la nube, como MongoDB Atlas)
- [Git](https://git-scm.com/)

### Pasos

1. **Clona el repositorio:**
   ```bash
   git clone https://github.com/onavi001/myvoice-next.git
   cd myvoice-next
   ```

2. **Instala las dependencias:**
   ```bash
   npm install
   ```

3. **Configura las variables de entorno:**
   Crea un archivo `.env.local` en la raíz del proyecto con las siguientes variables:
   ```
   MONGODB_URI=mongodb://localhost:27017/myvoice # O tu URI de MongoDB Atlas
   JWT_SECRET=tu-clave-secreta # Cambia esto por una clave segura
   ```
   - `MONGODB_URI`: Conexión a tu base de datos MongoDB.
   - `JWT_SECRET`: Clave para firmar tokens JWT (asegúrate de que sea única y segura).

4. **Ejecuta el proyecto en modo desarrollo:**
   ```bash
   npm run dev
   ```
   Abre tu navegador en `http://localhost:3000`.

5. **(Opcional) Compila para producción:**
   ```bash
   npm run build
   npm run start
   ```

## Uso

1. **Inicio de sesión o registro:**
   - Visita `/login` para registrarte o iniciar sesión.
   - Una vez autenticado, serás redirigido a `/app`.

2. **Dashboard (`/app`):**
   - Accede a tus rutinas, crea nuevas o revisa tu progreso desde el panel principal.

3. **Rutinas (`/app/routine`):**
   - Gestiona tus planes de entrenamiento y marca ejercicios como completados.

4. **Progreso (`/app/progress`):**
   - Registra tu desempeño y visualiza tu evolución en un gráfico.

5. **Crear Rutina (`/app/routine-form`):**
   - Diseña una nueva rutina manualmente o usa la generación con IA (`/app/routine-AI`).

## Estructura del proyecto

```
myvoice-next/
├── components/         # Componentes reutilizables (Button, Input, Card, etc.)
├── lib/               # Utilidades y configuración (MongoDB, middleware)
├── models/            # Esquemas de Mongoose (Usuario, Rutina, Progreso)
├── pages/             # Rutas de Next.js
│   ├── api/           # Endpoints de la API (auth, routines, progress)
│   ├── app/           # Rutas protegidas para usuarios autenticados
│   ├── auth/          # Rutas de autenticación (forgot-password)
│   └── login.tsx      # Página pública de login/registro
├── public/            # Archivos estáticos (imágenes, favicon)
├── store/             # Configuración de Redux (slices para user, routine, progress)
├── styles/            # Estilos globales
└── types/             # Definiciones de TypeScript
```

## Contribuir

¡Las contribuciones son bienvenidas! Si deseas colaborar:

1. Haz un fork del repositorio.
2. Crea una rama para tu feature o corrección (`git checkout -b feature/nueva-funcionalidad`).
3. Realiza tus cambios y haz commit (`git commit -m "Añadir nueva funcionalidad"`).
4. Sube tus cambios (`git push origin feature/nueva-funcionalidad`).
5. Abre un Pull Request en GitHub.

Por favor, sigue las guías de estilo existentes (ESLint/Prettier) y añade pruebas si es posible.

Reporta cualquier problema en la sección de [Issues](https://github.com/onavi001/myvoice-next/issues).

## Licencia

Este proyecto está bajo la [Licencia MIT](LICENSE). Siéntete libre de usarlo y modificarlo según tus necesidades.

## Contacto

Creado por [onavi001](https://github.com/onavi001). Si tienes preguntas o sugerencias, abre un issue o contáctame directamente.
