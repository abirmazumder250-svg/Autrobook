import { useState } from "react";

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });
}

async function uploadSingleProvider(targetProvider, file) {
  let res;

  if (targetProvider === "mega") {
    const formData = new FormData();
    formData.append("provider", "mega");
    formData.append("file", file);

    res = await fetch("/api/upload", {
      method: "POST",
      body: formData,
    });
  } else {
    const base64File = await fileToBase64(file);

    res = await fetch("/api/upload", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        provider: "imagekit",
        file: base64File,
        fileName: file.name,
        folder: "/autrobook-reels",
      }),
    });
  }

  const rawText = await res.text();
  let data = {};
  if (rawText) {
    try {
      data = JSON.parse(rawText);
    } catch {
      throw new Error(rawText.slice(0, 140) || `Invalid response from ${targetProvider}`);
    }
  }

  if (!res.ok || !data.success) {
    throw new Error(data.error || `Failed to upload to ${targetProvider}`);
  }

  return data;
}

function isSafeHttpUrl(url) {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "https:" || parsed.protocol === "http:";
  } catch {
    return false;
  }
}

export default function MultiUploadTest() {
  const [provider, setProvider] = useState("both"); // "both" | "imagekit" | "mega"
  const [file, setFile] = useState(null);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleUpload(e) {
    e.preventDefault();
    if (!file) return;

    setLoading(true);
    setError("");
    setResults([]);

    try {
      const targets = provider === "both" ? ["imagekit", "mega"] : [provider];

      const settled = await Promise.allSettled(
        targets.map((target) => uploadSingleProvider(target, file))
      );

      const succeeded = [];
      const failedMessages = [];

      settled.forEach((item, index) => {
        if (item.status === "fulfilled") {
          succeeded.push(item.value);
        } else {
          failedMessages.push(
            `${targets[index].toUpperCase()}: ${item.reason?.message || "Upload failed"}`
          );
        }
      });

      setResults(succeeded);
      if (failedMessages.length > 0) {
        setError(failedMessages.join(" | "));
      }
    } catch (err) {
      setError(err.message || "Unexpected upload error");
    } finally {
      setLoading(false);
    }
  }

  const buttonLabel = loading
    ? "Uploading..."
    : provider === "both"
    ? "Upload to ImageKit + MEGA"
    : `Upload to ${provider.toUpperCase()}`;

  return (
    <form onSubmit={handleUpload} style={{ maxWidth: "520px" }}>
      <div>
        <label htmlFor="provider-select">Storage Target: </label>
        <select
          id="provider-select"
          value={provider}
          onChange={(e) => setProvider(e.target.value)}
        >
          <option value="both">Both (ImageKit + MEGA)</option>
          <option value="imagekit">ImageKit Only</option>
          <option value="mega">MEGA Only</option>
        </select>
      </div>

      <div style={{ marginTop: "12px" }}>
        <input
          type="file"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
        />
      </div>

      <div style={{ marginTop: "12px" }}>
        <button type="submit" disabled={!file || loading}>
          {buttonLabel}
        </button>
      </div>

      {error && (
        <p style={{ color: "crimson", marginTop: "12px" }}>{error}</p>
      )}

      {results.length > 0 && (
        <div style={{ marginTop: "16px" }}>
          <h3>Upload Results</h3>
          {results.map((item, idx) => (
            <div
              key={`${item.provider || "provider"}-${idx}`}
              style={{
                border: "1px solid #ccc",
                borderRadius: "6px",
                padding: "10px",
                marginBottom: "10px",
              }}
            >
              <p>
                <strong>Provider:</strong> {item.provider}
              </p>
              <p>
                <strong>Name:</strong> {item.name}
              </p>
              <p>
                <strong>URL:</strong>{" "}
                {isSafeHttpUrl(item.url) ? (
                  <a href={item.url} target="_blank" rel="noreferrer">
                    {item.url}
                  </a>
                ) : (
                  <span>{item.url || "N/A"}</span>
                )}
              </p>
            </div>
          ))}
        </div>
      )}
    </form>
  );
}
