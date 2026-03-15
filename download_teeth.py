"""
Sketchfab GLB Downloader — University of Dundee Dental Models
=============================================================
Requirements:
    pip install requests

Usage:
    1. Get your Sketchfab API token from:
       https://sketchfab.com/settings/password  (scroll down to "API Token")
    2. Paste your token below where it says YOUR_TOKEN_HERE
    3. Run: python download_teeth.py
    4. Files will be saved to: ../dentra/public/teeth/
"""

import os
import time
import requests

# ── CONFIG ─────────────────────────────────────────────────
API_TOKEN = "cff082c35403416aa28ea79f64a8d544"   # ← paste your Sketchfab API token here
OUTPUT_DIR = "./public/teeth"   # save to dentra/public/teeth/
# ────────────────────────────────────────────────────────────

MODELS = {
    # filename             : sketchfab model ID
    "mx-central-incisor.glb" : "c8a7c2d9280d4c92bc651cfa1459866a",
    "mx-lateral-incisor.glb" : "5e89ddbfc6454e2e8e09c645574b8932",
    "mx-canine.glb"           : "bd930c9b9da14f2a9a8c9b130b0e08a2",
    "mx-1st-premolar.glb"    : "f9b48a29d34f4923b683433f030c5c70",
    "mx-2nd-premolar.glb"    : "69f3142830064588b000b04bea0ee09f",
    "mx-1st-molar.glb"       : "e719a474ef7e4bd7abec508f85f1e984",
    "mx-2nd-molar.glb"       : "e035713849d1438791306e25235ac452",
    "mx-3rd-molar.glb"       : "1b3c50ded70c4b6297d4526a733a9cf1",
    "md-central-incisor.glb" : "90dcbf474e5a4d97b8783b7eb2b9c4b7",
    "md-lateral-incisor.glb" : "00fa4f74e10b4769830bf60469c65e27",
    "md-canine.glb"           : "1082011ab5aa46bb96b2af6a02a4ec0c",
    "md-1st-premolar.glb"    : "935637a703dc49eb9eeec9b15a8a5c4c",
    "md-2nd-premolar.glb"    : "fe59fe04725446479bc1115bb12d0ad8",
    "md-1st-molar.glb"       : "e1c919d6603846eca873154eeededdd6",
    "md-2nd-molar.glb"       : "b77dcbc5052e4740b87cdb1964649742",
    "md-3rd-molar.glb"       : "561bb06b3b084b84978163906de1c2b5",
}

HEADERS = {"Authorization": f"Token {API_TOKEN}"}
BASE_URL = "https://api.sketchfab.com/v3"


def request_download(model_id: str) -> str | None:
    """Request a download URL for a model. Returns the download URL or None."""
    url = f"{BASE_URL}/models/{model_id}/download"
    res = requests.get(url, headers=HEADERS)

    if res.status_code == 401:
        print("  ✗ Invalid API token! Check your token at sketchfab.com/settings/password")
        return None
    if res.status_code == 403:
        print("  ✗ No permission to download this model (may require Pro account)")
        return None
    if res.status_code != 200:
        print(f"  ✗ Error {res.status_code}: {res.text[:100]}")
        return None

    data = res.json()
    # Get GLB format URL
    glb = data.get("glb") or data.get("source") or data.get("gltf")
    if not glb:
        print(f"  ✗ No GLB format available. Available: {list(data.keys())}")
        return None

    return glb.get("url")


def download_file(url: str, filepath: str) -> bool:
    """Download file from URL and save to filepath with progress."""
    res = requests.get(url, stream=True)
    if res.status_code != 200:
        print(f"  ✗ Download failed: {res.status_code}")
        return False

    total = int(res.headers.get("content-length", 0))
    downloaded = 0
    chunk_size = 8192

    with open(filepath, "wb") as f:
        for chunk in res.iter_content(chunk_size=chunk_size):
            if chunk:
                f.write(chunk)
                downloaded += len(chunk)
                if total:
                    pct = int(downloaded / total * 100)
                    bar = "█" * (pct // 5) + "░" * (20 - pct // 5)
                    print(f"\r  [{bar}] {pct}% ({downloaded//1024}KB/{total//1024}KB)", end="", flush=True)
    print()
    return True


def main():
    print("=" * 60)
    print("  Sketchfab GLB Downloader — University of Dundee")
    print("  Permanent Teeth 3D Models Collection")
    print("=" * 60)

    if API_TOKEN == "YOUR_TOKEN_HERE":
        print("\n⚠  Please set your API token first!")
        print("   Get it from: https://sketchfab.com/settings/password")
        print("   Scroll down to 'API Token' section")
        return

    # Create output directory
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    print(f"\n📁 Output folder: {os.path.abspath(OUTPUT_DIR)}\n")

    success = 0
    failed = 0

    for filename, model_id in MODELS.items():
        filepath = os.path.join(OUTPUT_DIR, filename)

        # Skip if already downloaded
        if os.path.exists(filepath):
            size_kb = os.path.getsize(filepath) // 1024
            print(f"  ✓ {filename} already exists ({size_kb} KB) — skipping")
            success += 1
            continue

        print(f"\n⬇  Downloading: {filename}")
        print(f"   Model ID: {model_id}")

        # Step 1: Request download URL
        download_url = request_download(model_id)
        if not download_url:
            failed += 1
            continue

        # Step 2: Download the file
        ok = download_file(download_url, filepath)
        if ok:
            size_kb = os.path.getsize(filepath) // 1024
            print(f"  ✓ Saved: {filename} ({size_kb} KB)")
            success += 1
        else:
            failed += 1

        # Be polite to the API — small delay between requests
        time.sleep(1.5)

    print("\n" + "=" * 60)
    print(f"  Done! ✓ {success} downloaded  ✗ {failed} failed")
    print(f"  Files saved to: {os.path.abspath(OUTPUT_DIR)}")
    print("=" * 60)

    if success > 0:
        print("\n✅ Next step: Run your Next.js app")
        print("   cd dentra && npm run dev")


if __name__ == "__main__":
    main()
