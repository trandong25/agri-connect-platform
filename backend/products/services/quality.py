import json
from pathlib import Path

import cv2
import numpy as np

QUALITY_MESSAGES = {
    "BLUR": {
        "warning": "Ảnh hơi mờ. Nếu có thể, hãy giữ chắc điện thoại và lấy nét vào sản phẩm.",
        "blocking": "Ảnh quá mờ, người mua sẽ khó nhìn rõ sản phẩm. Hãy chụp lại."
    },
    "DARK": {
        "warning": "Ảnh hơi tối. Nếu có thể, hãy chụp ở nơi sáng hơn.",
        "blocking": "Ảnh quá tối, sản phẩm không nhìn rõ. Hãy chụp lại ở nơi sáng hơn."
    },
    "OVEREXPOSED": {
        "warning": "Ảnh hơi sáng. Nên tránh ánh sáng chiếu trực tiếp vào sản phẩm.",
        "blocking": "Ảnh bị cháy sáng quá nhiều. Hãy đổi góc chụp hoặc giảm ánh sáng."
    },
    "LOW_CONTRAST": {
        "warning": "Ảnh hơi nhạt, sản phẩm chưa nổi bật. Nếu có thể, hãy đổi nền hoặc chụp ở nơi có ánh sáng tốt hơn.",
        "blocking": "Ảnh quá nhạt và khó nhìn rõ sản phẩm. Hãy chụp lại với ánh sáng hoặc nền khác."
    },
    "LOW_RESOLUTION": {
        "warning": "Ảnh hơi nhỏ. Nên dùng ảnh rõ hơn nếu có.",
        "blocking": "Ảnh có độ phân giải quá thấp. Hãy chọn hoặc chụp ảnh khác."
    }
}

ISSUE_ORDER = [
    "BLUR",
    "DARK",
    "OVEREXPOSED",
    "LOW_CONTRAST",
    "LOW_RESOLUTION"
]


def load_quality_config(config_path):
    return json.loads(Path(config_path).read_text(encoding="utf-8"))


def decode_image(image_bytes):
    array = np.frombuffer(image_bytes, dtype=np.uint8)
    return cv2.imdecode(array, cv2.IMREAD_COLOR)


def center_crop(image, ratio):
    height, width = image.shape[:2]
    ratio = float(np.clip(ratio, 0.5, 1.0))

    crop_width = max(1, int(width * ratio))
    crop_height = max(1, int(height * ratio))

    x1 = (width - crop_width) // 2
    y1 = (height - crop_height) // 2

    return image[y1:y1 + crop_height, x1:x1 + crop_width]


def resize_long_side(image, target_long_side):
    height, width = image.shape[:2]
    scale = target_long_side / max(height, width)

    new_size = (
        max(1, int(round(width * scale))),
        max(1, int(round(height * scale)))
    )

    interpolation = cv2.INTER_AREA if scale < 1 else cv2.INTER_CUBIC

    return cv2.resize(image, new_size, interpolation=interpolation)


def local_contrast_median(gray, grid=6):
    height, width = gray.shape
    values = []

    for row in range(grid):
        y1 = height * row // grid
        y2 = height * (row + 1) // grid

        for column in range(grid):
            x1 = width * column // grid
            x2 = width * (column + 1) // grid

            tile = gray[y1:y2, x1:x2]

            if tile.size:
                values.append(float(tile.std()))

    return float(np.median(values)) if values else 0.0


def calculate_quality_metrics(image, config):
    if image is None or image.size == 0:
        raise ValueError("Ảnh không hợp lệ")

    height, width = image.shape[:2]

    crop = center_crop(image, config["center_crop_ratio"])
    crop = resize_long_side(crop, config["target_long_side"])
    gray = cv2.cvtColor(crop, cv2.COLOR_BGR2GRAY)

    gray_values = gray.reshape(-1)

    normalized = (
        (gray.astype(np.float32) - np.float32(gray_values.mean()))
        / np.float32(gray_values.std() + 1e-6)
    ).astype(np.float32, copy=False)

    laplacian_raw = cv2.Laplacian(gray, cv2.CV_64F)
    laplacian_normalized = cv2.Laplacian(normalized, cv2.CV_32F)

    p05, p10, p50, p90, p95, p99 = np.percentile(
        gray_values,
        [5, 10, 50, 90, 95, 99]
    )

    return {
        "width": int(width),
        "height": int(height),
        "min_side": int(min(width, height)),
        "brightness_mean": round(float(gray_values.mean()), 3),
        "brightness_p05": round(float(p05), 3),
        "brightness_p10": round(float(p10), 3),
        "brightness_p50": round(float(p50), 3),
        "brightness_p90": round(float(p90), 3),
        "brightness_p95": round(float(p95), 3),
        "brightness_p99": round(float(p99), 3),
        "contrast_std": round(float(gray_values.std()), 3),
        "contrast_p90_p10": round(float(p90 - p10), 3),
        "contrast_p95_p05": round(float(p95 - p05), 3),
        "local_contrast_median": round(local_contrast_median(gray), 3),
        "laplacian_raw": round(float(np.var(laplacian_raw)), 4),
        "laplacian_normalized": round(float(np.var(laplacian_normalized)), 6),
        "dark_pixel_ratio": round(float(np.mean(gray_values < 45)), 4),
        "bright_pixel_ratio": round(float(np.mean(gray_values > 245)), 4)
    }


def evaluate_quality(metrics, config):
    blur_config = config["blur"]
    dark_config = config["dark"]
    overexposed_config = config["overexposed"]
    contrast_config = config["low_contrast"]
    resolution_config = config["min_side"]

    dark_warning = bool(
        metrics["brightness_p50"] < dark_config["warning_p50_max"]
        or (
            metrics["brightness_p50"] < dark_config["warning_secondary_p50_max"]
            and metrics["brightness_p90"] < dark_config["warning_secondary_p90_max"]
        )
        or metrics["dark_pixel_ratio"] > dark_config["warning_dark_pixel_ratio_min"]
    )

    dark_blocking = bool(
        (
            metrics["brightness_p50"] < dark_config["blocking_p50_max"]
            and metrics["brightness_p90"] < dark_config["blocking_p90_max"]
        )
        or metrics["dark_pixel_ratio"] > dark_config["blocking_dark_pixel_ratio_min"]
    )

    overexposed_warning = bool(
        metrics["brightness_p95"] > overexposed_config["warning_p95_min"]
        and metrics["bright_pixel_ratio"] > overexposed_config["warning_bright_pixel_ratio_min"]
    )

    overexposed_blocking = bool(
        metrics["brightness_p99"] > overexposed_config["blocking_p99_min"]
        and metrics["bright_pixel_ratio"] > overexposed_config["blocking_bright_pixel_ratio_min"]
    )

    exposure_warning = dark_warning or overexposed_warning

    blur_warning = bool(
        metrics["laplacian_normalized"] < blur_config["warning_laplacian_normalized_max"]
        and not exposure_warning
    )

    blur_blocking = bool(
        metrics["laplacian_normalized"] < blur_config["blocking_laplacian_normalized_max"]
        and not dark_blocking
        and not overexposed_blocking
    )

    low_contrast_warning = bool(
        metrics["contrast_std"] < contrast_config["warning_contrast_std_max"]
        and metrics["local_contrast_median"] < contrast_config["warning_local_contrast_median_max"]
        and not exposure_warning
    )

    low_contrast_blocking = bool(
        metrics["contrast_std"] < contrast_config["blocking_contrast_std_max"]
        and metrics["local_contrast_median"] < contrast_config["blocking_local_contrast_median_max"]
        and not dark_blocking
        and not overexposed_blocking
    )

    blur_low_contrast_blocking = bool(
        metrics["laplacian_normalized"] < blur_config["combined_blocking_laplacian_max"]
        and metrics["local_contrast_median"] < contrast_config["combined_blocking_local_contrast_max"]
        and not dark_blocking
        and not overexposed_blocking
    )

    low_resolution_warning = metrics["min_side"] < resolution_config["warning"]
    low_resolution_blocking = metrics["min_side"] < resolution_config["blocking"]

    warning_flags = {
        "BLUR": blur_warning,
        "DARK": dark_warning,
        "OVEREXPOSED": overexposed_warning,
        "LOW_CONTRAST": low_contrast_warning,
        "LOW_RESOLUTION": low_resolution_warning
    }

    blocking_flags = {
        "BLUR": blur_blocking or blur_low_contrast_blocking,
        "DARK": dark_blocking,
        "OVEREXPOSED": overexposed_blocking,
        "LOW_CONTRAST": low_contrast_blocking or blur_low_contrast_blocking,
        "LOW_RESOLUTION": low_resolution_blocking
    }

    blocking_issues = [name for name in ISSUE_ORDER if blocking_flags[name]]

    warning_issues = [
        name for name in ISSUE_ORDER
        if warning_flags[name] and name not in blocking_issues
    ]

    issues = blocking_issues + warning_issues
    score = max(0, 100 - sum(config["penalties"][name] for name in issues))

    instructions = []

    for name in blocking_issues:
        instructions.append(QUALITY_MESSAGES[name]["blocking"])

    for name in warning_issues:
        instructions.append(QUALITY_MESSAGES[name]["warning"])

    return {
        "quality_passed": not blocking_issues,
        "quality_issues": issues,
        "blocking_issues": blocking_issues,
        "warning_issues": warning_issues,
        "quality_score": int(score),
        "instructions": instructions,
        "metrics": metrics
    }


def analyze_quality(image, config):
    metrics = calculate_quality_metrics(image, config)
    return evaluate_quality(metrics, config)