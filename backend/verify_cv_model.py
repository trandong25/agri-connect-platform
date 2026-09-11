from pathlib import Path

from products.services.image_analysis import load_yolo_model

model_path = Path(__file__).resolve().parent / 'ml_models/yolo11_v6_best.pt'
model = load_yolo_model(model_path)
print('Checkpoint hợp lệ')
print(model.names)
