import { Storage } from "megajs";
import formidable from "formidable";
import fs from "fs";
import crypto from "crypto";
import ImageKit from "imagekit";

export const config = {
  api: {
    bodyParser: {
      sizeLimit: "25mb",
    },
  },
};

const imagekit = new ImageKit({
  publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
  privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
  urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT,
});

function parseMultipartForm(req) {
  const form = formidable({ multiples: false });
  return new Promise((resolve, reject) => {
    form.parse(req, (err, fields, files) => {
      if (err) reject(err);
      else resolve({ fields, files });
    });
  });
}

async function uploadToMega(file) {
  const tempFilePath = file.filepath;

  try {
    const storage = await new Storage({
      email: process.env.MEGA_EMAIL,
      password: process.env.MEGA_PASS,
    }).ready;

    const uploadedFile = await new Promise((resolve, reject) => {
      const uploadStream = storage.upload({
        name: file.originalFilename || "upload.bin",
        size: file.size,
      });

      const readStream = fs.createReadStream(tempFilePath);

      readStream.on("error", reject);
      uploadStream.on("error", reject);
      uploadStream.on("complete", resolve);

      readStream.pipe(uploadStream);
    });

    const link = await uploadedFile.link();

    return {
      provider: "mega",
      url: link,
      name: uploadedFile.name,
      size: uploadedFile.size,
    };
  } finally {
    if (tempFilePath && fs.existsSync(tempFilePath)) {
      fs.unlink(tempFilePath, () => {});
    }
  }
}

async function uploadToImageKit({ file, fileName, folder = "/autrobook-reels" }) {
  if (!file || !fileName) {
    throw new Error("Both file (base64/URL) and fileName are required for ImageKit");
  }

  const response = await imagekit.upload({
    file,
    fileName,
    folder,
  });

  return {
    provider: "imagekit",
    url: response.url,
    name: response.name,
    fileId: response.fileId,
  };
}

function createCloudinarySignature(paramsToSign, apiSecret) {
  const sortedQuery = Object.keys(paramsToSign)
    .filter((key) => paramsToSign[key] !== undefined && paramsToSign[key] !== "")
    .sort()
    .map((key) => `${key}=${paramsToSign[key]}`)
    .join("&");

  return crypto
    .createHash("sha1")
    .update(`${sortedQuery}${apiSecret}`)
    .digest("hex");
}

async function uploadToCloudinary({
  file,
  fileName,
  folder = "autrobook-reels",
  resourceType = "video",
}) {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error("Missing Cloudinary environment variables");
  }

  if (!file) {
    throw new Error("File (base64 or URL) is required for Cloudinary");
  }

  const timestamp = Math.floor(Date.now() / 1000);
  const cleanPublicId = fileName
    ? fileName.replace(/\.[^/.]+$/, "").replace(/[^a-zA-Z0-9_-]/g, "_")
    : `reel_${timestamp}`;

  const paramsToSign = {
    folder,
    public_id: cleanPublicId,
    timestamp,
  };

  const signature = createCloudinarySignature(paramsToSign, apiSecret);

  const formData = new FormData();
  formData.append("file", file);
  formData.append("api_key", apiKey);
  formData.append("timestamp", String(timestamp));
  formData.append("signature", signature);
  formData.append("folder", folder);
  formData.append("public_id", cleanPublicId);

  const endpoint = `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`;
  const response = await fetch(endpoint, {
    method: "POST",
    body: formData,
  });

  const data = await response.json();

  if (!response.ok || data.error) {
    throw new Error(data.error?.message || "Cloudinary upload failed");
  }

  return {
    provider: "cloudinary",
    url: data.secure_url,
    name: data.original_filename || cleanPublicId,
    publicId: data.public_id,
    resourceType: data.resource_type,
  };
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Only POST method is allowed" });
  }

  const contentType = req.headers["content-type"] || "";

  try {
    // Multipart form upload -> MEGA
    if (contentType.includes("multipart/form-data")) {
      const { fields, files } = await parseMultipartForm(req);
      const provider = Array.isArray(fields?.provider)
        ? fields.provider[0]
        : fields?.provider || "mega";

      const file = Array.isArray(files?.file) ? files.file[0] : files?.file;
      if (!file || !file.filepath) {
        return res.status(400).json({ error: "No file found in multipart request" });
      }

      if (provider !== "mega") {
        return res.status(400).json({
          error: "Use JSON base64/URL payload for ImageKit or Cloudinary",
        });
      }

      const data = await uploadToMega(file);
      return res.status(200).json({ success: true, ...data });
    }

    // JSON payload -> ImageKit or Cloudinary
    const { provider, file, fileName, folder, resourceType } = req.body || {};

    if (provider === "cloudinary") {
      const data = await uploadToCloudinary({
        file,
        fileName,
        folder: folder || "autrobook-reels",
        resourceType: resourceType || "video",
      });
      return res.status(200).json({ success: true, ...data });
    }

    if (provider === "imagekit" || (!provider && file && fileName)) {
      const data = await uploadToImageKit({
        file,
        fileName,
        folder: folder || "/autrobook-reels",
      });
      return res.status(200).json({ success: true, ...data });
    }

    return res.status(400).json({
      error:
        "Invalid request. Send multipart/form-data for MEGA, or JSON { provider: 'imagekit' | 'cloudinary', file, fileName }.",
    });
  } catch (error) {
    console.error("Upload error:", error);
    return res.status(500).json({
      success: false,
      error: error.message || "Upload failed",
    });
  }
}
