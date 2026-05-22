# TP DevOps

## Descripción

API REST desarrollada con [Node.js](https://nodejs.org/) y [Express](https://expressjs.com/), aplicando prácticas de DevOps: containerización, CI/CD, monitoreo y despliegue continuo.

---

## Tecnologías utilizadas

| Tecnología | Versión | Uso | Documentación |
|---|---|---|---|
| Node.js | 22 | Runtime de JavaScript | [nodejs.org](https://nodejs.org/docs/latest/api/) |
| Express | 5 | Framework web para la API | [expressjs.com](https://expressjs.com/) |
| Jest | 30 | Framework de testing | [jestjs.io](https://jestjs.io/) |
| Supertest | 7 | HTTP assertions en tests | [github.com/ladjs/supertest](https://github.com/ladjs/supertest) |
| StandardJS | 17 | Linter de código | [standardjs.com](https://standardjs.com/) |
| Docker | — | Containerización | [docs.docker.com](https://docs.docker.com/) |
| Docker Compose | — | Orquestación local | [docs.docker.com/compose](https://docs.docker.com/compose/) |
| GitHub Actions | — | CI/CD | [docs.github.com/actions](https://docs.github.com/en/actions) |
| Docker Hub | — | Registry de imágenes | [hub.docker.com](https://hub.docker.com/) |
| Render | — | Plataforma de despliegue | [render.com/docs](https://render.com/docs) |
| OpenTelemetry | — | Instrumentación | [opentelemetry.io](https://opentelemetry.io/docs/) |
| Grafana Cloud | — | Monitoreo (trazas y métricas) | [grafana.com/docs](https://grafana.com/docs/) |

---

## API

### Endpoints

| Método | Endpoint | Descripción | Status |
|---|---|---|---|
| GET | `/` | Hello World | 200 |
| GET | `/health` | Estado de la aplicación | 200 |
| GET | `/error` | Simulación de error | 500 |

### Correr localmente

```bash
npm install
npm run dev
```

La app levanta en `http://localhost:3000`.

---

## Pruebas unitarias

Se utiliza **[Jest](https://jestjs.io/)** como framework de testing y **[Supertest](https://github.com/ladjs/supertest)** para realizar requests HTTP sobre la app sin levantar un servidor real.

Supertest recibe la instancia de Express directamente (`app`) sin necesidad de que el servidor esté escuchando en ningún puerto, lo que hace los tests más rápidos y aislados.

```bash
npm run test
```

Hay tests para los tres endpoints cubriendo status code y estructura de respuesta.

### Babel

Se usa **[Babel](https://babeljs.io/)** (`@babel/preset-env` + `babel-jest`) para que Jest pueda procesar los módulos ES (`import/export`), ya que Jest no los soporta nativamente y el proyecto usa `"type": "module"` en el `package.json`.

---

## Docker

### Por qué Docker

Docker garantiza que la app corra de la misma forma en cualquier entorno, eliminando el problema de "funciona en mi máquina". La imagen base es [`node:22-alpine`](https://hub.docker.com/_/node) — Alpine Linux es una distribución minimalista que reduce considerablemente el tamaño final de la imagen.

### Dockerfile

```dockerfile
FROM node:22-alpine       # Imagen base liviana

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev     # Solo dependencias de producción

COPY . .

EXPOSE 3000

CMD ["node", "--import", "./instrumentation.mjs", "index.js"]
```

El flag `--import` carga `instrumentation.mjs` antes de ejecutar `index.js`, asegurando que OpenTelemetry esté activo desde el primer momento.

```bash
# Buildear la imagen
docker build -t tp-devops .

# Correr el contenedor
docker run -p 3000:3000 tp-devops
```

---

## Docker Compose

[Docker Compose](https://docs.docker.com/compose/) orquesta múltiples contenedores como un único servicio. En este proyecto se usa para levantar el stack completo de observabilidad en desarrollo local.

| Servicio | Imagen | Puerto | Descripción |
|---|---|---|---|
| app | (build local) | 3000 | API Node.js |
| otel-collector | `otel/opentelemetry-collector-contrib` | 4317, 4318 | Recolector de telemetría |
| jaeger | `jaegertracing/all-in-one` | 16686 | Visualización de trazas |
| prometheus | `prom/prometheus` | 9090 | Almacenamiento de métricas |
| grafana | `grafana/grafana` | 3001 | Dashboard de métricas |

```bash
docker compose up
```

### Flujo local de observabilidad

```
App → OTel Collector → Prometheus (métricas) → Grafana (visualización)
                    → Jaeger (trazas)
```

El `otel-collector-config.yml` define cómo el collector recibe datos (OTLP gRPC/HTTP), los procesa en batches y los exporta a Jaeger y Prometheus.

---

## CI/CD

El pipeline está dividido en tres workflows de [GitHub Actions](https://docs.github.com/en/actions):

### Actions reutilizadas

| Action | Versión | Descripción | Link |
|---|---|---|---|
| `actions/checkout` | v6 | Clona el repositorio en el runner | [github.com/actions/checkout](https://github.com/actions/checkout) |
| `docker/login-action` | — | Login a Docker Hub | [github.com/docker/login-action](https://github.com/docker/login-action) |
| `docker/metadata-action` | — | Genera tags y labels para la imagen | [github.com/docker/metadata-action](https://github.com/docker/metadata-action) |
| `docker/build-push-action` | — | Buildea y pushea la imagen | [github.com/docker/build-push-action](https://github.com/docker/build-push-action) |
| `actions/attest` | v4 | Genera attestation de la imagen | [github.com/actions/attest](https://github.com/actions/attest) |

---

### 1. Pipeline de CI — `pipeline.yml`

Se dispara en cada `push` a cualquier branch.

**Jobs:**
- **lint** — verifica el estilo de código con [StandardJS](https://standardjs.com/). StandardJS es un linter con reglas predefinidas sin necesidad de configuración.
- **tests** — corre la suite de Jest.

Ambos jobs corren en paralelo e instalan dependencias de forma independiente.

---

### 2. Publicación de imagen — `publish.yml`

Se dispara cuando se crea un tag con formato `vX.X.X` **desde la branch master**.

La condición `push: ${{ github.event.base_ref == 'refs/heads/master' }}` en el step de build-push garantiza que solo se publique la imagen si el tag fue creado desde master, aunque el workflow haya sido disparado por un tag de otra branch.

**Steps:**
1. Checkout del repositorio
2. Login a Docker Hub usando secrets (`DOCKER_USERNAME`, `DOCKER_PASSWORD`)
3. **`docker/metadata-action`** — genera automáticamente los tags de la imagen basándose en el tag de git:
   - `1.0.0` (versión exacta)
   - `1.0` (última patch de esa minor)
   - `1` (último release del major)
   - `latest` (última versión publicada)
4. **`docker/build-push-action`** — buildea y publica la imagen en [Docker Hub](https://hub.docker.com/r/forlenzamaximiliano/tp-devops)
5. **`actions/attest`** — genera una [attestation](https://docs.github.com/en/actions/security-for-github-actions/using-artifact-attestations/using-artifact-attestations-to-establish-provenance-for-builds) criptográfica que certifica que la imagen fue construida por este workflow y no fue modificada

---

### 3. Deploy a Render — `deploy.yml`

Se dispara automáticamente cuando el workflow de publicación termina con éxito, usando el trigger `workflow_run`.

Llama al deploy hook de Render (URL almacenada en el secret `RENDER_DEPLOY_HOOK_URL`) mediante `curl`, lo que indica a Render que debe desplegar la última imagen disponible.

---

### Flujo completo

```
Push a cualquier branch   → CI: lint + tests

Crear tag vX.X.X en master → Publish: imagen a Docker Hub con tags semver
                           → Deploy: Render despliega la nueva imagen
```

---

## Versionado semántico

Las imágenes de Docker siguen [Semantic Versioning](https://semver.org/):

- `MAJOR` (`v2.0.0`) — cambios que rompen compatibilidad con versiones anteriores
- `MINOR` (`v1.1.0`) — funcionalidad nueva manteniendo compatibilidad
- `PATCH` (`v1.0.1`) — corrección de bugs

Para publicar una nueva versión se crea una [release desde GitHub](https://docs.github.com/en/repositories/releasing-projects-on-github/managing-releases-in-a-repository) asociando el tag correspondiente, lo que dispara el pipeline automáticamente.

---

## Monitoreo

### Por qué OpenTelemetry

[OpenTelemetry](https://opentelemetry.io/) es el estándar abierto para observabilidad. Permite capturar trazas y métricas sin acoplarse a un vendor específico — el mismo código puede enviar datos a Grafana Cloud, Datadog, New Relic, Jaeger, etc., cambiando solo variables de entorno.

### Señales capturadas

- **Trazas** — registro de cada request con duración, status y spans internos
- **Métricas** — datos numéricos agregados (latencia, tasa de requests, errores)

### Instrumentación automática

El paquete [`@opentelemetry/auto-instrumentations-node`](https://www.npmjs.com/package/@opentelemetry/auto-instrumentations-node) instrumenta automáticamente librerías populares (Express, http, etc.) sin modificar el código de la app.

El archivo `instrumentation.mjs` se carga antes de la app mediante el flag `--import` de Node.js:

```
node --import ./instrumentation.mjs index.js
```

### Exportadores

| Paquete | Descripción |
|---|---|
| [`@opentelemetry/exporter-trace-otlp-http`](https://www.npmjs.com/package/@opentelemetry/exporter-trace-otlp-http) | Exporta trazas via OTLP HTTP |
| [`@opentelemetry/exporter-metrics-otlp-http`](https://www.npmjs.com/package/@opentelemetry/exporter-metrics-otlp-http) | Exporta métricas via OTLP HTTP |

### Flujo en producción

```
App (Render) → Grafana Cloud via OTLP HTTP
```

### Variables de entorno en Render

| Variable | Descripción |
|---|---|
| `OTEL_SERVICE_NAME` | Nombre del servicio en Grafana |
| `OTEL_EXPORTER_OTLP_ENDPOINT` | Endpoint de Grafana Cloud |
| `OTEL_EXPORTER_OTLP_HEADERS` | Token de autenticación (Basic Auth) |
| `OTEL_EXPORTER_OTLP_PROTOCOL` | Protocolo de exportación (`http/protobuf`) |
| `OTEL_NODE_RESOURCE_DETECTORS` | Detectores de recursos del SDK (`env,host,os`) |

### Ver las trazas

**Grafana Cloud → Explore** → seleccionar datasource de traces → tab **Search**.

Las trazas del endpoint `/error` aparecen con status `Error`, permitiendo crear dashboards de tasa de errores vs requests exitosos.

---

## Estructura del proyecto

```
tp-devops/
├── .github/
│   └── workflows/
│       ├── pipeline.yml          # CI: lint y tests en cada push
│       ├── publish.yml           # CD: publica imagen Docker en tags vX.X.X
│       └── deploy.yml            # CD: deploy a Render post-publicación
├── __tests__/
│   └── app.test.js               # Tests unitarios de los endpoints
├── grafana/
│   └── provisioning/
│       └── datasources/
│           └── datasource.yml    # Datasource de Prometheus para Grafana local
├── app.js                        # Definición de rutas Express
├── index.js                      # Entry point, levanta el servidor
├── instrumentation.mjs           # Setup de OpenTelemetry SDK
├── babel.config.js               # Config de Babel para Jest
├── Dockerfile                    # Imagen de producción
├── docker-compose.yml            # Stack local de observabilidad
├── otel-collector-config.yml     # Config del OTel Collector
├── prometheus.yml                # Config de scraping de Prometheus
└── render.yaml                   # Config de infraestructura en Render
```
