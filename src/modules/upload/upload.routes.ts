import { Router } from 'express';
import multer from 'multer';
import { authenticate, authorize } from '@/middlewares/auth';
import { ApiError } from '@/shared/ApiError';
import { HttpStatus } from '@/shared/httpStatus';
import { uploadImage } from '@/modules/upload/upload.controller';

// Buffer uploads in memory (max 5MB, images only) — we forward straight to ImgBB.
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new ApiError(HttpStatus.BAD_REQUEST, 'Only image files are allowed'));
    }
  },
});

const router = Router();

router.post('/image', authenticate, authorize('admin'), upload.single('image'), uploadImage);

export const uploadRoutes = router;
