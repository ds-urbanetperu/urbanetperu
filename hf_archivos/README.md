---
title: UrbanetMini Pothole Severity
emoji: 🕳️
colorFrom: yellow
colorTo: red
sdk: docker
app_port: 7860
pinned: false
license: mit
---

# UrbanetMini - Detección de gravedad de baches

Este Space sirve como servicio de IA para **UrbanetMini Lite**. Recibe una imagen de un bache, ejecuta un modelo YOLOv8 entrenado y devuelve una gravedad estimada.

## Archivos del Space

```txt
app.py
best.pt
requirements.txt
classes.json
Dockerfile
.gitattributes
README.md
```

## Modelo usado

El archivo `best.pt` corresponde a un modelo YOLOv8 entrenado con tres clases:

| Clase del modelo | Gravedad para UrbanetMini |
|---|---|
| `minor_pothole` | Leve |
| `medium_pothole` | Moderado |
| `major_pothole` | Muy grave |

Si el modelo no detecta un bache con suficiente confianza, el Space devuelve:

```json
{
  "severity": "Pendiente",
  "confidence": 0,
  "label": "no_detection",
  "detections": 0
}
```

## Respuesta esperada por UrbanetMini

```json
{
  "severity": "Muy grave",
  "confidence": 0.86,
  "label": "major_pothole",
  "detections": 1
}
```

## Integración con el backend

Como el Space será **público**, UrbanetMini puede dejar el token vacío:

```env
HUGGING_FACE_API_URL=https://TU_USUARIO-TU_SPACE.hf.space
HUGGING_FACE_API_TOKEN=
```

Esta decisión es intencional: el backend no necesita token mientras el Space se mantenga público.

## Nota para la documentación del proyecto

La IA no decide directamente la prioridad municipal. UrbanetMini usa la gravedad estimada por este Space junto con la cantidad de reportes y ciudadanos estimados para calcular la prioridad del caso de bache.
