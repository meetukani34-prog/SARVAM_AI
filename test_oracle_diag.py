import os
import httpx
import json

NVIDIA_API_KEY = "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"
NVIDIA_BASE_URL = "https://integrate.api.nvidia.com/v1"
MODEL_NAME = "meta/llama3-70b-instruct"

def test_oracle():
    print(f"Testing Oracle with model: {MODEL_NAME}...")
    headers = {
        "Authorization": f"Bearer {NVIDIA_API_KEY}",
        "Content-Type": "application/json"
    }
    payload = {
        "model": MODEL_NAME,
        "messages": [
            {"role": "system", "content": "Refine this code: print('hello')"},
            {"role": "user", "content": "print('hello')"}
        ],
        "stream": False
    }
    
    try:
        r = httpx.post(f"{NVIDIA_BASE_URL}/chat/completions", json=payload, headers=headers, timeout=30.0)
        print(f"Status: {r.status_code}")
        if r.status_code == 200:
            data = r.json()
            content = data['choices'][0]['message']['content']
            print("--- RESPONSE ---")
            print(content)
            print("--- END ---")
        else:
            print(f"Error: {r.text}")
    except Exception as e:
        print(f"FAILED: {str(e)}")

if __name__ == "__main__":
    test_oracle()
