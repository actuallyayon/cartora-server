import { ApiError } from '@/shared/ApiError';
import { HttpStatus } from '@/shared/httpStatus';
import { env } from '@/config/env';

export interface UploadedImage {
  url: string;
  displayUrl: string;
  deleteUrl?: string;
}

interface ImgBBResponse {
  success?: boolean;
  data?: { url?: string; display_url?: string; delete_url?: string };
  error?: { message?: string };
}

/**
 * Upload an image buffer to ImgBB and return its hosted URL. The API key stays
 * server-side; the browser only ever sees the resulting URL.
 */
export const uploadToImgBB = async (buffer: Buffer, filename?: string): Promise<UploadedImage> => {
  if (!env.IMGBB_API_KEY) {
    throw new ApiError(
      HttpStatus.SERVICE_UNAVAILABLE,
      'Image uploads are not configured (missing IMGBB_API_KEY)',
    );
  }

  const form = new FormData();
  form.append('image', buffer.toString('base64'));
  if (filename) form.append('name', filename);

  let payload: ImgBBResponse;
  try {
    const res = await fetch(`https://api.imgbb.com/1/upload?key=${env.IMGBB_API_KEY}`, {
      method: 'POST',
      body: form,
    });
    payload = (await res.json()) as ImgBBResponse;
  } catch {
    throw new ApiError(HttpStatus.SERVICE_UNAVAILABLE, 'Image host is unreachable');
  }

  if (!payload.success || !payload.data?.url) {
    throw new ApiError(HttpStatus.BAD_REQUEST, payload.error?.message ?? 'Image upload failed');
  }

  return {
    url: payload.data.url,
    displayUrl: payload.data.display_url ?? payload.data.url,
    deleteUrl: payload.data.delete_url,
  };
};
