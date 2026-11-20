import { Storage } from 'megajs';
import formidable from 'formidable';
import fs from 'fs';

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Only POST method is allowed' });
  }

  let tempFilePath = null;

  try {
    const form = formidable({ multiples: false });
    const [, files] = await form.parse(req);
    const file = files?.file?.[0];

    if (!file || !file.filepath) {
      return res.status(400).json({ error: 'No file found in request' });
    }

    tempFilePath = file.filepath;

    const storage = await new Storage({
      email: process.env.MEGA_EMAIL,
      password: process.env.MEGA_PASS,
    }).ready;

    const uploadedFile = await new Promise((resolve, reject) => {
      const uploadStream = storage.upload({
        name: file.originalFilename || 'upload.bin',
        size: file.size,
      });

      const readStream = fs.createReadStream(tempFilePath);

      readStream.on('error', reject);
      uploadStream.on('error', reject);
      uploadStream.on('complete', resolve);

      readStream.pipe(uploadStream);
    });

    const link = await uploadedFile.link();

    return res.status(200).json({
      success: true,
      link,
      name: uploadedFile.name,
      size: uploadedFile.size,
    });
  } catch (error) {
    console.error('Upload error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to upload file to MEGA',
    });
  } finally {
    if (tempFilePath && fs.existsSync(tempFilePath)) {
      fs.unlink(tempFilePath, () => {});
    }
  }
}
