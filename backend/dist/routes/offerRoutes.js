import { Router } from 'express';
import { getAllOffers, createOrUpdateOffer, toggleOfferStatus, deleteOffer } from '../controllers/offerController.js';
import { directoryProtect } from '../middlewares/authMiddleware.js';
const router = Router();
// Public: Get active offers for website header, popups, and discounts
router.get('/', getAllOffers);
// Protected: Admin manage offers
router.post('/', directoryProtect, createOrUpdateOffer);
router.patch('/:id/toggle', directoryProtect, toggleOfferStatus);
router.delete('/:id', directoryProtect, deleteOffer);
export default router;
