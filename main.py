from fastapi import FastAPI, File, UploadFile
from fastapi.responses import JSONResponse
from rembg import remove
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

# Modèle
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
                    try:
                        img = Image.open(os.path.join(class_path, fname)).convert("RGB")
                        ref_images.setdefault(class_name, []).append(img)
                    except:
                        continue
    return ref_images

@app.post("/predict")
async def predict(file: UploadFile = File(...)):
    # Lecture + suppression du fond
    image_bytes = await file.read()
    no_bg_bytes = remove(image_bytes)
    query_img = Image.open(io.BytesIO(no_bg_bytes)).convert("RGB")

    # Chargement des images de référence
    ref_images = load_ref_images()

    best_sim = -1
    best_label = ""

    with torch.no_grad():
        query_tensor = transform(query_img).unsqueeze(0)
        query_feat = model(query_tensor)

        for label, images in ref_images.items():
            sims = []
            for ref_img in images:
                ref_tensor = transform(ref_img).unsqueeze(0)
                ref_feat = model(ref_tensor)
                sim = F.cosine_similarity(query_feat, ref_feat).item()
                sims.append(sim)

            avg_sim = sum(sims) / len(sims)
            if avg_sim > best_sim:
                best_sim = avg_sim
                best_label = label

    # Enregistrement temporaire du fichier
    os.makedirs("output", exist_ok=True)
    filename = f"{best_label}.png"
    file_path = os.path.join("output", filename)
    with open(file_path, "wb") as f:
        f.write(no_bg_bytes)

    # Upload vers ImgBB
    imgbb_url = ""
    with open(file_path, "rb") as f:
        response = requests.post(
            "https://api.imgbb.com/1/upload",
            params={"key": IMGBB_API_KEY},
            files={"image": (filename, f)}
        )
        if response.ok:
            imgbb_url = response.json()["data"]["url"]

    return JSONResponse({
        "class": best_label,
        "similarity": round(best_sim, 4),
        "image_url": imgbb_url
    })

