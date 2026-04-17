#!/usr/bin/env python3
"""
CVita GitHub Push Helper
Kullanım: python3 github_push.py <dosya_yolu> <repo_yolu> <commit_mesaji>
Örnek: python3 github_push.py /mnt/user-data/outputs/dashboard.html public/dashboard.html "fix dashboard"
"""

import sys
import base64
import json
import urllib.request
import urllib.error

TOKEN = "YOUR_TOKEN_HERE"
REPO = "YOUR_USERNAME/YOUR_REPO"
BRANCH = "main"

def push_file(local_path: str, repo_path: str, commit_msg: str):
    # Dosyayı oku
    with open(local_path, 'rb') as f:
        content = base64.b64encode(f.read()).decode()

    api_url = f"https://api.github.com/repos/{REPO}/contents/{repo_path}"
    headers = {
        "Authorization": f"token {TOKEN}",
        "Accept": "application/vnd.github.v3+json",
        "Content-Type": "application/json"
    }

    # Mevcut SHA'yı al (update için gerekli)
    sha = None
    try:
        req = urllib.request.Request(api_url, headers=headers)
        with urllib.request.urlopen(req) as res:
            data = json.loads(res.read())
            sha = data.get("sha")
    except urllib.error.HTTPError as e:
        if e.code != 404:
            raise

    # Push
    body = {
        "message": commit_msg,
        "content": content,
        "branch": BRANCH
    }
    if sha:
        body["sha"] = sha

    req = urllib.request.Request(
        api_url,
        data=json.dumps(body).encode(),
        headers=headers,
        method="PUT"
    )
    with urllib.request.urlopen(req) as res:
        result = json.loads(res.read())
        print(f"✅ Push başarılı: {repo_path}")
        print(f"   Commit: {result['commit']['sha'][:7]} — {commit_msg}")

if __name__ == "__main__":
    if len(sys.argv) < 4:
        print("Kullanım: python3 github_push.py <local_path> <repo_path> <commit_msg>")
        sys.exit(1)
    push_file(sys.argv[1], sys.argv[2], sys.argv[3])
