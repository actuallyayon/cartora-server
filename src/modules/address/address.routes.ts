import { Router } from 'express';
import { validateRequest } from '@/middlewares/validateRequest';
import { authenticate } from '@/middlewares/auth';
import { createAddressSchema, updateAddressSchema } from '@/modules/address/address.validation';
import { list, create, update, remove, markDefault } from '@/modules/address/address.controller';

const router = Router();

router.get('/', authenticate, list);
router.post('/', authenticate, validateRequest(createAddressSchema), create);
router.patch('/:id', authenticate, validateRequest(updateAddressSchema), update);
router.delete('/:id', authenticate, remove);
router.patch('/:id/default', authenticate, markDefault);

export const addressRoutes = router;
