from fastapi import FastAPI, File, UploadFile
from fastapi.responses import JSONResponse
from rembg import remove, new_session
from PIL import Image
import torch
import os
import io
import requests
import torch.nn.functional as F
from torchvision import models, transforms
from dotenv import load_dotenv

load_dotenv()
IMGBB_API_KEY = os.getenv("IMGBB_API_KEY")

app = FastAPI()

@app.get("/")
def root():
    return {"message": "API is running"}

# Charge modèle léger
model = models.resnet18(weights="IMAGENET1K_V1")
model.fc = torch.nn.Identity()
model.eval()

transform = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.ToTensor(),
    transforms.Normalize(mean=[0.485, 0.456, 0.406],
                         std=[0.229, 0.224, 0.225]),
])

def load_ref_images(ref_dir="ref"):
    ref_images = {}
    for class_name in os.listdir(ref_dir):
        class_path = os.path.join(ref_dir, class_name)
        if os.path.isdir(class_path):
            for fname in os.listdir(class_path):
                if fname.lower().endswith((".png", ".jpg", ".jpeg", ".avif")):
                    ref_images.setdefault(class_name, []).append(os.path.join(class_path, fname))
    return ref_images

@app.post("/predict")
async def predict(file: UploadFile = File(...)):
    try:
        # Supprimer le fond
        session = new_session("u2net")
        image_bytes = await file.read()
        no_bg = remove(image_bytes, session=session)
        query_img = Image.open(io.BytesIO(no_bg)).convert("RGB")

        # Feature de l'image requête
        query_tensor = transform(query_img).unsqueeze(0)
        query_feat = model(query_tensor)

        best_sim, best_label = -1, ""
        ref_images = load_ref_images()

        with torch.no_grad():
            for label, paths in ref_images.items():
                sims = []
                for path in paths:
                    try:
                        ref_img = Image.open(path).convert("RGB")
                        ref_tensor = transform(ref_img).unsqueeze(0)
                        ref_feat = model(ref_tensor)
                        sim = F.cosine_similarity(query_feat, ref_feat).item()
                        sims.append(sim)
                    except:
                        continue
                if sims:
                    avg = sum(sims) / len(sims)
                    if avg > best_sim:
                        best_sim, best_label = avg, label

        # Upload direct vers ImgBB
        imgbb_url = ""
        image_io = io.BytesIO(no_bg)
        image_io.seek(0)
        response = requests.post(
            "https://api.imgbb.com/1/upload",
            params={"key": IMGBB_API_KEY},
            files={"image": ("output.png", image_io)}
        )
        if response.ok:
            imgbb_url = response.json()["data"]["url"]

        return JSONResponse({
            "class": best_label,
            "similarity": round(best_sim, 4),
            "image_url": imgbb_url
        })

    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={"error": "Prediction failed", "details": str(e)}
        )