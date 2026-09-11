from functools import lru_cache
from pathlib import Path
from threading import Lock

from .quality import analyze_quality, decode_image, load_quality_config

CENTER_OFFSET_THRESHOLD = 0.22
MIN_PRODUCT_AREA_RATIO = 0.025
CROP_EDGE_MARGIN_RATIO = 0.005
MIN_LAYOUT_CONFIDENCE = 0.20
MAX_LAYOUT_CONFIDENCE = 0.35
MAX_LAYOUT_BOXES = 5
PREDICTION_LOCK = Lock()


@lru_cache(maxsize=2)
def load_yolo_model(model_path):
    from ultralytics import YOLO

    path = Path(model_path)

    if not path.exists():
        raise FileNotFoundError(f"Không tìm thấy mô hình: {path}")

    return YOLO(str(path))


def empty_composition():
    return {
        "composition_status": "NOT_ANALYZED",
        "composition_passed": False,
        "issues": [],
        "instructions": [],
        "area_ratio": None,
        "center_offset_x": None,
        "center_offset_y": None,
        "edge_margin_ratio": None,
        "bbox_xyxy": None,
        "confidence": None,
        "detections": []
    }


def analyze_composition_from_boxes(boxes, image_shape):
    height, width = image_shape[:2]

    x1 = min(box[0] for box in boxes)
    y1 = min(box[1] for box in boxes)
    x2 = max(box[2] for box in boxes)
    y2 = max(box[3] for box in boxes)

    center_x = (x1 + x2) / 2
    center_y = (y1 + y2) / 2

    area_ratio = ((x2 - x1) * (y2 - y1)) / (width * height)
    center_offset_x = abs(center_x - width / 2) / width
    center_offset_y = abs(center_y - height / 2) / height

    edge_margin_ratio = min(
        x1 / width,
        y1 / height,
        (width - x2) / width,
        (height - y2) / height
    )

    cropped = edge_margin_ratio <= CROP_EDGE_MARGIN_RATIO
    off_center = max(center_offset_x, center_offset_y) > CENTER_OFFSET_THRESHOLD
    too_small = area_ratio < MIN_PRODUCT_AREA_RATIO

    issues = []
    instructions = []

    if cropped:
        issues.append("PRODUCT_NEAR_EDGE")
        instructions.append(
            "Sản phẩm đang khá sát mép ảnh. Nếu có thể, hãy lùi điện thoại một chút."
        )

    if off_center:
        issues.append("PRODUCT_OFF_CENTER")
        instructions.append("Nếu thuận tiện, hãy đặt sản phẩm gần giữa khung hình hơn.")

    if too_small:
        issues.append("PRODUCT_TOO_SMALL")
        instructions.append("Sản phẩm hơi nhỏ trong ảnh. Có thể đưa điện thoại lại gần hơn.")

    status = "ACCEPT_WITH_GUIDANCE" if issues else "ACCEPT"

    return {
        "composition_status": status,
        "composition_passed": not issues,
        "issues": issues,
        "instructions": instructions,
        "area_ratio": round(float(area_ratio), 4),
        "center_offset_x": round(float(center_offset_x), 4),
        "center_offset_y": round(float(center_offset_y), 4),
        "edge_margin_ratio": round(float(edge_margin_ratio), 4),
        "bbox_xyxy": [round(float(value), 2) for value in (x1, y1, x2, y2)]
    }


def get_layout_confidence(value):
    try:
        confidence = float(value)
    except (TypeError, ValueError):
        confidence = MIN_LAYOUT_CONFIDENCE

    return min(max(confidence, MIN_LAYOUT_CONFIDENCE), MAX_LAYOUT_CONFIDENCE)


def analyze_layout_from_result(result, image_shape, layout_confidence):
    detections = []

    if result.boxes is not None:
        for box in result.boxes:
            confidence = float(box.conf[0].item())
            bbox = [float(value) for value in box.xyxy[0].cpu().tolist()]

            detections.append({
                "class_id": int(box.cls[0].item()),
                "confidence": round(confidence, 4),
                "bbox": bbox
            })

    if not detections:
        return empty_composition()

    detections.sort(key=lambda item: item["confidence"], reverse=True)

    best_confidence = detections[0]["confidence"]

    usable = [
        item for item in detections
        if item["confidence"] >= layout_confidence
    ][:MAX_LAYOUT_BOXES]

    if not usable:
        result_data = empty_composition()
        result_data["confidence"] = best_confidence
        result_data["detections"] = detections
        return result_data

    boxes = [item["bbox"] for item in usable]
    composition = analyze_composition_from_boxes(boxes, image_shape)

    return {
        **composition,
        "confidence": best_confidence,
        "detections": detections
    }


def analyze_layout(image, model_path, detection_confidence, suggestion_confidence, device):
    try:
        model = load_yolo_model(str(model_path))

        with PREDICTION_LOCK:
            result = model.predict(
                source=image,
                imgsz=640,
                conf=detection_confidence,
                device=device,
                verbose=False
            )[0]

        layout_confidence = get_layout_confidence(suggestion_confidence)

        return analyze_layout_from_result(result, image.shape, layout_confidence)
    except Exception:
        return empty_composition()


def error_response(message):
    return {
        "status": "ERROR",
        "can_continue": False,
        "quality_passed": False,
        "quality_issues": ["INVALID_IMAGE"],
        "quality_score": 0,
        "layout_analyzed": False,
        "layout_passed": False,
        "layout_status": "NOT_ANALYZED",
        "layout_warnings": [],
        "confidence": None,
        "instructions": ["Chọn lại một ảnh hợp lệ."],
        "message": message,
        "quality_metrics": {},
        "layout_metrics": {},
        "detections": []
    }


def unique_messages(messages):
    result = []

    for message in messages:
        if message and message not in result:
            result.append(message)

    return result


def analyze_image_bytes(
    image_bytes,
    model_path,
    quality_config_path,
    detection_confidence=0.05,
    suggestion_confidence=0.50,
    device="cpu"
):
    image = decode_image(image_bytes)

    if image is None:
        return error_response("Không đọc được ảnh.")

    quality_config = load_quality_config(quality_config_path)
    quality = analyze_quality(image, quality_config)

    if not quality["quality_passed"]:
        return {
            "status": "RETAKE",
            "can_continue": False,
            "quality_passed": False,
            "quality_issues": quality["quality_issues"],
            "quality_score": quality["quality_score"],
            "layout_analyzed": False,
            "layout_passed": False,
            "layout_status": "NOT_ANALYZED",
            "layout_warnings": [],
            "confidence": None,
            "instructions": quality["instructions"],
            "message": "Ảnh chưa thể sử dụng. " + " ".join(quality["instructions"]),
            "quality_metrics": quality["metrics"],
            "layout_metrics": {},
            "detections": []
        }

    layout = analyze_layout(
        image,
        model_path,
        detection_confidence,
        suggestion_confidence,
        device
    )

    layout_analyzed = layout["composition_status"] != "NOT_ANALYZED"
    instructions = unique_messages(quality["instructions"] + layout["instructions"])

    if instructions:
        message = "Ảnh có thể sử dụng. Bạn có thể cải thiện ảnh theo các gợi ý bên dưới."
    else:
        message = "Ảnh rõ và có thể sử dụng."

    return {
        "status": "READY",
        "can_continue": True,
        "quality_passed": True,
        "quality_issues": quality["quality_issues"],
        "quality_score": quality["quality_score"],
        "layout_analyzed": layout_analyzed,
        "layout_passed": layout["composition_passed"],
        "layout_status": layout["composition_status"],
        "layout_warnings": layout["issues"],
        "confidence": layout["confidence"],
        "instructions": instructions,
        "message": message,
        "quality_metrics": quality["metrics"],
        "layout_metrics": {
            "area_ratio": layout["area_ratio"],
            "center_offset_x": layout["center_offset_x"],
            "center_offset_y": layout["center_offset_y"],
            "edge_margin_ratio": layout["edge_margin_ratio"],
            "bbox_xyxy": layout["bbox_xyxy"]
        },
        "detections": layout["detections"]
    }