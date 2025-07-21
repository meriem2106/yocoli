from rembg import remove
from PIL import Image
import os
import torch
from torchvision import models, transforms
import torch.nn.functional as F
from pillow_avif import AvifImagePlugin

# 📁 Étape 1: Supprimer le fond
input_path = "input/fish.png"
output_path = "output/no_bg.png"

with open(input_path, "rb") as i:
    with open(output_path, "wb") as o:
        o.write(remove(i.read()))

print("Fond supprimé.")

# 🔍 Étape 2: Identification par similarité
# Charger l'image nettoyée
query_img = Image.open(output_path).convert("RGB")

# Charger images de référence
ref_dir = "ref"
ref_images = {}

for class_name in os.listdir(ref_dir):
    class_path = os.path.join(ref_dir, class_name)
    if not os.path.isdir(class_path):
        continue
    for filename in os.listdir(class_path):
        if filename.endswith((".png", ".jpg", ".jpeg", ".avif")):
            img_path = os.path.join(class_path, filename)
            img = Image.open(img_path).convert("RGB")
            ref_images.setdefault(class_name, []).append(img)

# Prétraitement commun
transform = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.ToTensor(),
    transforms.Normalize(mean=[0.485, 0.456, 0.406],
                         std=[0.229, 0.224, 0.225]),
])

# Encoder l’image de l’utilisateur
model = models.resnet18(pretrained=True)
model.fc = torch.nn.Identity()
model.eval()

with torch.no_grad():
    query_tensor = transform(query_img).unsqueeze(0)
    query_feat = model(query_tensor)

    best_sim = -1
    best_label = "Inconnu"

for label, images in ref_images.items():
    sims = []
    for ref_img in images:
        ref_tensor = transform(ref_img).unsqueeze(0)
        ref_feat = model(ref_tensor)
        sim = F.cosine_similarity(query_feat, ref_feat).item()
        sims.append(sim)

    avg_sim = sum(sims) / len(sims)
    print(f"🔎 Similarité moyenne avec {label}: {avg_sim:.4f}")

    if avg_sim > best_sim:
        best_sim = avg_sim
        best_label = label

print(f"\n Classe prédite : {best_label}")