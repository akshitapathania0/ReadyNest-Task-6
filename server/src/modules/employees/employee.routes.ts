import { Router } from 'express';
import { employeeController } from './employee.controller';
import { authenticate, authorize } from '../../middlewares/auth.middleware';
import { upload } from '../../utils/upload';

const router = Router();

router.use(authenticate);

router.get('/', employeeController.getAll);
router.get('/me', employeeController.getMyProfile);
router.get('/:id', employeeController.getById);
router.put('/:id', employeeController.update);
router.post('/:id/photo', upload.single('photo'), employeeController.uploadPhoto);
router.post('/:id/documents', authorize('SUPER_ADMIN', 'HR'), upload.single('file'), employeeController.uploadDocument);
router.delete('/:id', authorize('SUPER_ADMIN'), employeeController.delete);

export default router;
