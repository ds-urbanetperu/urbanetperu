import json
import os
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

import gradio as gr
import numpy as np
from PIL import Image
from ultralytics import YOLO

MODEL_PATH = os.getenv("MODEL_PATH", "best.pt")
CONFIDENCE_THRESHOLD = float(os.getenv("CONFIDENCE_THRESHOLD", "0.25"))
IMAGE_SIZE = int(os.getenv("IMAGE_SIZE", "640"))

CLASS_TO_SEVERITY = {
    "minor_pothole": "Leve",
    "medium_pothole": "Moderado",
    "major_pothole": "Muy grave",
    # Soporte adicional por si algún dataset conserva la etiqueta genérica.
    "pothole": "Leve",
}

SEVERITY_RANK = {
    "Pendiente": 0,
    "Leve": 1,
    "Moderado": 2,
    "Muy grave": 3,
}

MODEL_SOURCE = "urbanetmini-yolov8-pothole-severity"

if not Path(MODEL_PATH).exists():
    raise FileNotFoundError(
        f"No se encontró el modelo '{MODEL_PATH}'. Verifica que best.pt esté en el Space."
    )

model = YOLO(MODEL_PATH)


def _to_float(value: Any) -> float:
    """Convierte tensores/arrays/números a float de forma segura."""
    try:
        return float(value.item())
    except AttributeError:
        return float(value)


def _to_int(value: Any) -> int:
    """Convierte tensores/arrays/números a int de forma segura."""
    try:
        return int(value.item())
    except AttributeError:
        return int(value)


def _empty_response(message: str = "No se detectó un bache con suficiente confianza.") -> Dict[str, Any]:
    return {
        "severity": "Pendiente",
        "confidence": 0.0,
        "label": "no_detection",
        "detections": 0,
        "message": message,
        "source": MODEL_SOURCE,
    }


def _select_representative_detection(detections: List[Dict[str, Any]]) -> Optional[Dict[str, Any]]:
    """
    Selecciona la detección más representativa para UrbanetMini.

    Criterio simple y explicable para una versión lite:
    1. Se prioriza la mayor gravedad.
    2. Si hay empate, se toma la mayor confianza.
    """
    if not detections:
        return None

    return sorted(
        detections,
        key=lambda item: (
            SEVERITY_RANK.get(item["severity"], 0),
            item["confidence"],
        ),
        reverse=True,
    )[0]


def _resolve_file_path(file_obj):
    """
    Convierte el archivo recibido por Gradio en una ruta local usable.
    Soporta string, dict y objetos FileData.
    """
    if file_obj is None:
        return None

    if isinstance(file_obj, str):
        return file_obj

    if isinstance(file_obj, dict):
        return file_obj.get("path") or file_obj.get("name")

    path = getattr(file_obj, "path", None)
    if path:
        return path

    name = getattr(file_obj, "name", None)
    if name:
        return name

    return str(file_obj)


def predict_pothole_severity_api(image_file):
    """
    Endpoint limpio para el backend de UrbanetMini.
    Acepta la imagen desde la API y devuelve solo JSON.
    """
    image_path = _resolve_file_path(image_file)

    if image_path is None:
        return _empty_response("No se recibió ninguna imagen desde la API.")

    response, _ = predict_pothole_severity(image_path)
    return response

def predict_pothole_severity(image_path: str) -> Tuple[Dict[str, Any], Optional[Image.Image]]:
    """
    Recibe una imagen, ejecuta YOLOv8 y devuelve una respuesta estable para UrbanetMini.

    Esta versión abre la imagen con PIL antes de enviarla a YOLO.
    Así funciona incluso cuando Gradio guarda el archivo sin extensión, por ejemplo:
    /tmp/gradio/.../blob
    """
    if image_path is None:
        return _empty_response("No se recibió ninguna imagen."), None

    try:
        original_image = Image.open(image_path).convert("RGB")
    except Exception as error:
        return _empty_response(f"No se pudo abrir la imagen recibida: {error}"), None

    image_array = np.array(original_image)

    results = model.predict(
        source=image_array,
        conf=CONFIDENCE_THRESHOLD,
        imgsz=IMAGE_SIZE,
        verbose=False,
    )

    if not results:
        return _empty_response(), original_image

    result = results[0]
    names = result.names or {}
    detections: List[Dict[str, Any]] = []

    if result.boxes is not None:
        for box in result.boxes:
            confidence = _to_float(box.conf[0])
            if confidence < CONFIDENCE_THRESHOLD:
                continue

            class_id = _to_int(box.cls[0])
            label = names.get(class_id, str(class_id))
            severity = CLASS_TO_SEVERITY.get(label, "Pendiente")

            detections.append(
                {
                    "label": label,
                    "severity": severity,
                    "confidence": round(confidence, 4),
                    "class_id": class_id,
                }
            )

    selected = _select_representative_detection(detections)

    annotated_array = result.plot()
    if isinstance(annotated_array, np.ndarray):
        annotated_rgb = annotated_array[:, :, ::-1]
        annotated_image = Image.fromarray(annotated_rgb)
    else:
        annotated_image = original_image

    if selected is None:
        return _empty_response(), annotated_image

    response = {
        "severity": selected["severity"],
        "confidence": selected["confidence"],
        "label": selected["label"],
        "detections": len(detections),
        "all_detections": detections,
        "source": MODEL_SOURCE,
        "threshold": CONFIDENCE_THRESHOLD,
    }

    return response, annotated_image

with gr.Blocks(title="UrbanetMini - Gravedad de baches") as demo:
    gr.Markdown(
        """
        # UrbanetMini - Detección de gravedad de baches

        Este Space recibe una imagen de un bache y devuelve una gravedad estimada para UrbanetMini:
        **Leve**, **Moderado**, **Muy grave** o **Pendiente**.
        """
    )

    with gr.Row():
        input_image = gr.Image(
            label="Imagen del bache",
            type="filepath",
        )
        output_image = gr.Image(
            label="Resultado visual",
            type="pil",
        )

    output_json = gr.JSON(label="Respuesta para UrbanetMini")
    predict_button = gr.Button("Analizar bache")

    predict_button.click(
        fn=predict_pothole_severity,
        inputs=input_image,
        outputs=[output_json, output_image],
        api_name="predict",
    )

    # Endpoint oculto para el backend de UrbanetMini.
    # Devuelve solo JSON y recibe el archivo como gr.File.
    api_file = gr.File(
        label="Imagen API",
        type="filepath",
        visible=False,
    )

    api_output = gr.JSON(
        label="Respuesta API",
        visible=False,
    )

    api_button = gr.Button(
        "API Predict",
        visible=False,
    )

    api_button.click(
        fn=predict_pothole_severity_api,
        inputs=api_file,
        outputs=api_output,
        api_name="api_predict",
    )

    gr.Markdown(
        """
        ## Formato esperado por el backend

        ```json
        {
          "severity": "Muy grave",
          "confidence": 0.86,
          "label": "major_pothole",
          "detections": 1
        }
        ```
        """
    )


if __name__ == "__main__":
    port = int(os.getenv("PORT", "7860"))
    demo.launch(server_name="0.0.0.0", server_port=port)
