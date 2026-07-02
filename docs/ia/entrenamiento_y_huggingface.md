# Entrenamiento del modelo IA y despliegue en Hugging Face

## 1. Objetivo

La integración de inteligencia artificial en **UrbanetPeru** tiene como objetivo apoyar la evaluación de reportes ciudadanos de baches mediante el análisis automático de imágenes. El modelo permite estimar la gravedad del bache reportado y entregar esta información al sistema para que pueda ser usada como criterio de apoyo en la priorización de incidencias.

La IA no reemplaza la revisión municipal. Su función es brindar una clasificación inicial que ayude a ordenar los reportes según la posible severidad del daño observado en la imagen.

## 2. Modelo utilizado

Para la detección de baches se utilizó **YOLOv8**, un modelo de visión por computadora orientado a la detección de objetos en imágenes. En este caso, el modelo fue entrenado para reconocer baches y clasificarlos según su nivel de severidad.

El modelo final entrenado se almacenó en el archivo:

```txt
best.pt
```

Este archivo contiene los pesos finales del entrenamiento y es el recurso principal utilizado por el servicio desplegado en Hugging Face Spaces.

## 3. Dataset utilizado

El entrenamiento se realizó usando un conjunto de imágenes de baches anotadas por nivel de severidad. Las clases consideradas fueron:

```txt
minor_pothole
medium_pothole
major_pothole
```

Para su uso dentro de UrbanetPeru, estas clases se interpretan de la siguiente manera:

| Clase del modelo | Severidad interpretada |
|---|---|
| `minor_pothole` | Leve |
| `medium_pothole` | Moderado |
| `major_pothole` | Muy grave |

En el sistema, la severidad detectada puede ser utilizada para apoyar la definición de prioridad del reporte. Por ejemplo, un bache detectado como **Muy grave** puede ser tratado como un caso de mayor urgencia para la revisión municipal.

## 4. Preparación de los datos

El dataset original contiene imágenes y anotaciones de baches. Las anotaciones se encuentran en formato XML, por lo que fue necesario convertirlas al formato requerido por YOLO.

El proceso general de preparación fue el siguiente:

1. Cargar las imágenes y anotaciones del dataset.
2. Leer las anotaciones XML de cada imagen.
3. Extraer las cajas delimitadoras y las clases asociadas.
4. Convertir las anotaciones al formato YOLO.
5. Separar los datos en conjuntos de entrenamiento, validación y prueba.
6. Generar el archivo de configuración `dataset.yaml`.

Esta preparación permitió que YOLOv8 pudiera entrenarse correctamente con las clases de severidad definidas.

## 5. Entrenamiento en Google Colab

El entrenamiento se realizó en **Google Colab**, utilizando la librería **Ultralytics** para trabajar con YOLOv8. El flujo de entrenamiento siguió estos pasos generales:

1. Montaje del entorno de trabajo.
2. Instalación de dependencias necesarias.
3. Conversión de anotaciones XML al formato YOLO.
4. División del dataset en entrenamiento, validación y prueba.
5. Creación del archivo `dataset.yaml`.
6. Entrenamiento del modelo YOLOv8.
7. Obtención del archivo final `best.pt`.

El modelo entrenado fue preparado para recibir una imagen de un bache y devolver la severidad estimada según las clases aprendidas.

## 6. Archivo generado: `best.pt`

El archivo `best.pt` representa el mejor modelo obtenido durante el entrenamiento. Este archivo contiene los pesos entrenados de YOLOv8 y es utilizado directamente por la aplicación desplegada en Hugging Face.

Dentro del flujo de UrbanetPeru, `best.pt` cumple la función de motor de inferencia para analizar las imágenes enviadas desde los reportes ciudadanos.

## 7. Despliegue en Hugging Face Spaces

El modelo fue desplegado en un **Hugging Face Space** público para permitir su consumo desde UrbanetPeru.

El Space utilizado es:

```txt
https://luisserva02-urbanetperu.hf.space
```

El Space contiene los archivos necesarios para ejecutar el modelo:

```txt
app.py
best.pt
classes.json
requirements.txt
Dockerfile
README.md
.gitattributes
```

Descripción breve de los archivos principales:

| Archivo | Función |
|---|---|
| `app.py` | Define la aplicación Gradio y la lógica de inferencia del modelo. |
| `best.pt` | Modelo YOLOv8 entrenado para detectar gravedad de baches. |
| `classes.json` | Define el mapeo de clases del modelo hacia severidades entendibles por el sistema. |
| `requirements.txt` | Lista las dependencias necesarias para ejecutar el Space. |
| `Dockerfile` | Configura el entorno de ejecución del Space. |

Al ser un Space público, UrbanetPeru puede consumir el servicio mediante su URL sin necesidad de configurar un token privado de Hugging Face.

## 8. Endpoint utilizado por UrbanetPeru

El endpoint utilizado por UrbanetPeru para consumir la IA es:

```txt
/api_predict
```

Este endpoint recibe una imagen y devuelve una respuesta en formato JSON con la severidad estimada por el modelo. Se utiliza como un endpoint limpio para el backend, ya que devuelve únicamente los datos necesarios para el sistema.

El endpoint visual del Space puede ser usado para pruebas manuales, pero para la integración con UrbanetPeru se utiliza `/api_predict`.

## 9. Formato de respuesta de la IA

La respuesta esperada del servicio de Hugging Face tiene una estructura similar a la siguiente:

```json
{
  "severity": "Muy grave",
  "confidence": 0.86,
  "label": "major_pothole",
  "detections": 1
}
```

Campos principales:

| Campo | Descripción |
|---|---|
| `severity` | Severidad estimada para el bache. Puede ser `Leve`, `Moderado`, `Muy grave` o `Pendiente`. |
| `confidence` | Nivel de confianza de la predicción. |
| `label` | Clase original detectada por el modelo. |
| `detections` | Cantidad de detecciones válidas encontradas en la imagen. |

Cuando el modelo no detecta un bache con suficiente confianza, puede devolver una respuesta con severidad `Pendiente` o equivalente, permitiendo que el reporte continúe sin bloquear el flujo principal del sistema.

## 10. Consideraciones

- El modelo se utiliza como apoyo para la priorización de reportes, no como decisión final automática.
- La severidad detectada depende de la calidad de la imagen enviada por el ciudadano.
- Si la imagen no permite una detección confiable, el sistema puede conservar la severidad como no determinada o pendiente.
- El Space de Hugging Face se mantiene público, por lo que no se requiere token para consumirlo.
- El archivo `best.pt` debe mantenerse dentro del Space para que la inferencia funcione correctamente.
- Si en el futuro el Space se vuelve privado, será necesario configurar un token de Hugging Face en el backend.

## 11. Referencias

Dataset usado como base:

```txt
https://www.kaggle.com/datasets/idanbaru/annotated-potholes-with-severity-levels
```

Notebook de referencia:

```txt
https://www.kaggle.com/code/idanbaru/yolov8-train-and-inference-medium-model
```
