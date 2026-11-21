import { Storage } from "megajs";
import formidable from "formidable";
import fs from "fs";
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
        return res.status(400).json({ error: "Use JSON base64 payload for ImageKit" });
      }

      const data = await uploadToMega(file);
      return res.status(200).json({ success: true, ...data });
    }

    // JSON payload -> ImageKit (base64)
    const { provider, file, fileName, folder } = req.body || {};

    if (provider === "imagekit" || (!provider && file && fileName)) {
      const data = await uploadToImageKit({ file, fileName, folder });
      return res.status(200).json({ success: true, ...data });
    }

    return res.status(400).json({
      error: "Invalid request. Send multipart/form-data for MEGA or JSON { file, fileName } for ImageKit.",
    });
  } catch (error) {
    console.error("Upload error:", error);
    return res.status(500).json({
      success: false,
      error: error.message || "Upload failed",
    });
  }
}
