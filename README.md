# DJUCED MIDI Mapper

Aplicación Electron para mapear controladoras MIDI (Hercules 500/200) a controles de DJUCED.

## Características

- **Detección de dispositivos MIDI**: Lista y conecta dispositivos MIDI disponibles
- **Grabación de comandos**: Graba comandos MIDI en tiempo real desde tu controladora
- **Editor de mapeos**: Asigna comandos MIDI a acciones de DJUCED
- **Base de datos de acciones**: Extrae automáticamente todas las acciones disponibles de archivos .djm de referencia
- **Generación de archivos .djm**: Guarda tus mapeos en formato compatible con DJUCED
- **Modo de prueba**: Prueba tus mapeos simulando o enviando comandos reales a DJUCED

## Requisitos

- Node.js 18 o superior
- npm o yarn
- Controladora MIDI compatible (Hercules 500, Hercules 200, etc.)

## Instalación

1. Clona o descarga este repositorio
2. Instala las dependencias:

```bash
npm install
```

## Desarrollo

Para ejecutar la aplicación en modo desarrollo:

```bash
npm run dev
```

Esto compilará TypeScript y ejecutará la aplicación Electron con recarga automática.

## Compilación

Para compilar la aplicación:

```bash
npm run build
```

Para crear un ejecutable:

```bash
npm run package
```

## Uso

1. **Conectar dispositivo MIDI**:
   - Selecciona tu controladora MIDI de entrada en el panel "Dispositivos MIDI"
   - Opcionalmente selecciona un dispositivo de salida si quieres probar comandos
   - Haz clic en "Conectar"

2. **Grabar comandos**:
   - Haz clic en "Grabar Nuevo Comando"
   - Presiona una tecla o mueve un control en tu controladora
   - El comando MIDI será capturado y mostrado

3. **Crear mapeo**:
   - Después de grabar un comando, se te pedirá un nombre para el control
   - Se abrirá un diálogo para seleccionar la acción de DJUCED
   - Selecciona la acción, canal y parámetros
   - Guarda el mapeo

4. **Probar mapeos**:
   - Usa el panel "Probar Mapeos" para ver qué acciones se ejecutarían
   - Modo "Simular": Muestra qué acción se ejecutaría sin enviar MIDI
   - Modo "Enviar a DJUCED": Envía comandos MIDI reales (requiere DJUCED abierto)

5. **Guardar mapeo**:
   - Haz clic en "Guardar Mapeo"
   - Elige un nombre y ubicación para el archivo .djm
   - El archivo será compatible con DJUCED

## Estructura del Proyecto

```
djuced-midi-mapper/
├── src/
│   ├── main/              # Proceso principal de Electron
│   │   ├── main.ts        # Punto de entrada
│   │   ├── preload.ts     # Script de preload
│   │   └── midi-handler.ts # Manejo MIDI
│   ├── renderer/          # Proceso de renderizado
│   │   ├── app.ts         # Lógica principal
│   │   ├── index.html     # UI principal
│   │   ├── styles.css     # Estilos
│   │   ├── components/    # Componentes UI
│   │   └── utils/         # Utilidades (parsers, generadores)
│   └── shared/            # Código compartido
│       └── types.ts       # Tipos TypeScript
├── todos/                 # Archivos .djm de referencia
└── package.json
```

## Tecnologías

- **Electron**: Framework para aplicación desktop
- **TypeScript**: Lenguaje principal
- **easymidi**: Librería para manejo MIDI
- **DOMParser**: Para parsear XML de archivos .djm

## Notas

- Los archivos .djm de referencia en la carpeta `todos/` se usan para extraer todas las acciones disponibles de DJUCED
- La aplicación funciona mejor con controladoras Hercules, pero debería funcionar con cualquier dispositivo MIDI estándar
- Para probar comandos reales, asegúrate de que DJUCED esté abierto y configurado para recibir MIDI

## Licencia

MIT
