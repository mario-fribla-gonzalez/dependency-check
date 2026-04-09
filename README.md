# Node Dependency Check Action

Una GitHub Action que escanea las dependencias del proyecto en busca de vulnerabilidades conocidas usando [OWASP Dependency Check](https://owasp.org/www-project-dependency-check/).

## Características

- 🔍 Escanea las dependencias del proyecto en busca de vulnerabilidades conocidas
- 📊 Genera reportes en múltiples formatos (HTML, XML, JSON)
- 🚀 Umbrales de severidad configurables
- 💾 Caché inteligente para mejor rendimiento
- 🔧 Soporta múltiples tipos de proyectos y lenguajes
- 🔑 Soporte opcional de clave API NVD para datos de vulnerabilidades mejorados

## Uso

### Uso Básico

```yaml
name: Escaneo de Seguridad
on: [push, pull_request]

jobs:
  security-scan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Ejecutar Dependency Check
        uses: ./
```

### Uso Avanzado

```yaml
name: Escaneo de Seguridad
on: [push, pull_request]

jobs:
  security-scan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Ejecutar Dependency Check
        uses: ./
        with:
          project: 'MiProyecto'
          path: './src'
          format: 'HTML,JSON'
          args: '--failOnCVSS 7 --enableRetired'
          version: '12.1.0'
          out: 'reportes-seguridad'
          workdir: './backend'
          suppression-url: 'https://raw.githubusercontent.com/company/security-config/main/nvd-suppression.xml'
        env:
          NVD_API_KEY: ${{ secrets.NVD_API_KEY }}
```

## Formatos de Reporte

La action soporta múltiples formatos de salida:

- **HTML**: Reporte legible para humanos con detalles de vulnerabilidades
- **XML**: Formato legible por máquina para integración con otras herramientas
- **JSON**: Formato de datos estructurados para procesamiento programático
- **CSV**: Formato tabular para análisis en hojas de cálculo
- **JUNIT**: Formato XML JUnit para integración CI/CD

## Argumentos Comunes

Puedes personalizar el comportamiento del escaneo usando la entrada `args`:

```yaml
args: |
  --failOnCVSS 7
  --enableRetired
  --disableCentral
  --noupdate
  --exclude "**/*.min.js"
  --suppression suppression.xml
```

### Argumentos Útiles

- `--failOnCVSS X`: Falla la construcción si se encuentran vulnerabilidades con puntaje CVSS >= X
- `--enableRetired`: Habilita la verificación de dependencias retiradas
- `--disableCentral`: Deshabilita el análisis de Maven Central
- `--noupdate`: Omite la actualización de la base de datos de vulnerabilidades
- `--exclude "patrón"`: Excluye archivos que coincidan con el patrón
- `--suppression archivo.xml`: Usa archivo de supresión para ignorar falsos positivos

## Directorio de Trabajo

El parámetro `workdir` permite especificar desde qué directorio ejecutar el escaneo. Esto es útil cuando:

- Tu proyecto tiene múltiples submódulos o aplicaciones
- Los archivos de dependencias están en un subdirectorio específico
- Necesitas ejecutar el escaneo desde un contexto diferente

```yaml
- name: Escanear Backend
  uses: ./
  with:
    workdir: './backend'
    path: '.'
    out: 'backend-reports'

- name: Escanear Frontend
  uses: ./
  with:
    workdir: './frontend'
    path: '.'
    out: 'frontend-reports'
```

**Nota**: Los paths relativos en `path` y `out` serán relativos al `workdir` especificado.

## Clave API NVD

Para mejor rendimiento y evitar limitaciones de velocidad, considera usar una clave API NVD:

1. Obtén una clave API gratuita de [NVD](https://nvd.nist.gov/developers/request-an-api-key)
2. Agrégala como secreto del repositorio llamado `NVD_API_KEY`
3. La action la usará automáticamente si está disponible

## Ejemplo de Workflow con Subida de Artefactos

```yaml
name: Escaneo de Seguridad
on: [push, pull_request]

jobs:
  security-scan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Ejecutar Dependency Check
        uses: ./
        with:
          format: 'HTML,JSON'
          out: 'reportes'
        env:
          NVD_API_KEY: ${{ secrets.NVD_API_KEY }}

      - name: Subir Reportes de Seguridad
        uses: actions/upload-artifact@v4
        if: always()
        with:
          name: reportes-seguridad
          path: reportes/
```

## Archivo de Supresión

### Descarga Automática de Archivo de Supresión

La action puede descargar automáticamente un archivo de supresión desde una URL usando el parámetro `suppression-url`:

```yaml
- name: Ejecutar Dependency Check
  uses: ./
  with:
    suppression-url: 'https://raw.githubusercontent.com/tu-org/security-config/main/nvd-suppression.xml'
```

### Crear Archivo de Supresión Manual

Para ignorar falsos positivos manualmente, crea un archivo XML de supresión:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<suppressions xmlns="https://jeremylong.github.io/DependencyCheck/dependency-suppression.1.3.xsd">
    <suppress>
        <notes><![CDATA[
        Falso positivo - esta vulnerabilidad no aplica a nuestro uso
        ]]></notes>
        <packageUrl regex="true">^pkg:npm/lodash@.*$</packageUrl>
        <cve>CVE-2021-23337</cve>
    </suppress>
</suppressions>
```

## Lenguajes y Frameworks Soportados

- JavaScript/Node.js (package.json, package-lock.json, yarn.lock)
- Java (Maven, Gradle)
- .NET (packages.config, *.csproj)
- Python (requirements.txt, Pipfile.lock)
- Ruby (Gemfile.lock)
- PHP (composer.lock)
- Y muchos más...

## Consejos de Rendimiento

1. **Usa Clave API NVD**: Mejora significativamente la velocidad del escaneo
2. **Estrategia de Caché**: La action automáticamente almacena en caché la base de datos de vulnerabilidades
3. **Excluye Archivos Innecesarios**: Usa patrones `--exclude` para archivos de prueba o directorios vendor
4. **Deshabilita Repositorio Central**: Usa `--disableCentral` si no es necesario

## Solución de Problemas

### La Construcción Falla con Puntaje CVSS

Si tu construcción falla debido a vulnerabilidades:

1. Revisa los reportes generados en el directorio `reportes`
2. Actualiza las dependencias vulnerables si es posible
3. Usa archivo de supresión para falsos positivos
4. Ajusta el umbral `--failOnCVSS`

### Problemas de Memoria

Para proyectos grandes, podrías necesitar aumentar la memoria:

```yaml
args: '--jvmArgs "-Xmx4g"'
```

## Contribuir

1. Haz fork del repositorio
2. Crea una rama de característica
3. Realiza tus cambios
4. Prueba exhaustivamente
5. Envía un pull request


## Proyectos Relacionados

- [OWASP Dependency Check](https://owasp.org/www-project-dependency-check/)
- [GitHub Security Advisories](https://github.com/advisories)
- [Snyk](https://snyk.io/)

---
DevOps Mario Fribla Gonzalez
