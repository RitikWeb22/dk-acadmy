import { Offer } from '../models/Offer.js';
const SEED_OFFERS = [
    {
        offerType: 'banner',
        title: 'Top Announcement Banner',
        tagText: 'SPECIAL ADMISSION ALERT',
        message: 'JEE Main & Advanced 2026-27 Batches Open! Avail up to 90% Merit Scholarship + Kota Study Material.',
        linkText: 'Explore Batches',
        linkUrl: '/courses',
        isActive: true,
        priority: 1
    },
    {
        offerType: 'popup',
        title: 'Kota Flagship Batch - Limited Admission Offer!',
        tagText: 'EXCLUSIVE SCHOLARSHIP',
        message: 'Get direct mentorship under Dharmendra Kumar (DK Sir) with 20-30s math inspection shortcuts, daily DPPs & CBT test series.',
        imageUrl: '/img/dk-results-banner.jpeg',
        buttonText: 'Claim Scholarship & Enroll Now',
        linkUrl: '/courses',
        audience: 'all',
        frequency: 'once_per_session',
        isActive: true,
        priority: 1
    },
    {
        offerType: 'item_discount',
        title: 'IIT-JEE Merit Flash Sale',
        badgeText: '🔥 MERIT SALE 25% OFF',
        discountType: 'percent',
        discountValue: 25,
        targetScope: 'all',
        applicableItemIds: [],
        message: 'Instant 25% discount applied across all premium flagship courses and CBT mock series.',
        isActive: false,
        priority: 1
    }
];
export const getAllOffers = async (_req, res) => {
    try {
        const count = await Offer.countDocuments();
        if (count === 0) {
            await Offer.insertMany(SEED_OFFERS);
        }
        const offers = await Offer.find().sort({ priority: 1, createdAt: -1 });
        const bannerOffer = offers.find((o) => o.offerType === 'banner' && o.isActive) || offers.find((o) => o.offerType === 'banner') || null;
        const popupOffer = offers.find((o) => o.offerType === 'popup' && o.isActive) || offers.find((o) => o.offerType === 'popup') || null;
        const itemOffers = offers.filter((o) => o.offerType === 'item_discount');
        res.status(200).json({
            success: true,
            data: {
                all: offers,
                bannerOffer,
                popupOffer,
                itemOffers
            }
        });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
export const createOrUpdateOffer = async (req, res) => {
    try {
        const { id, _id, ...offerData } = req.body;
        const offerId = id || _id;
        if (!offerData.title || !offerData.title.trim()) {
            res.status(400).json({ success: false, message: 'Offer title is required' });
            return;
        }
        if (offerId) {
            const updated = await Offer.findByIdAndUpdate(offerId, { $set: offerData }, { new: true, runValidators: true });
            if (!updated) {
                res.status(404).json({ success: false, message: 'Offer not found' });
                return;
            }
            res.status(200).json({ success: true, message: 'Offer updated successfully', data: updated });
            return;
        }
        const newOffer = await Offer.create(offerData);
        res.status(201).json({ success: true, message: 'Offer created successfully', data: newOffer });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
export const toggleOfferStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const offer = await Offer.findById(id);
        if (!offer) {
            res.status(404).json({ success: false, message: 'Offer not found' });
            return;
        }
        offer.isActive = !offer.isActive;
        await offer.save();
        res.status(200).json({
            success: true,
            message: `Offer "${offer.title}" is now ${offer.isActive ? 'Active' : 'Inactive'}`,
            data: offer
        });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
export const deleteOffer = async (req, res) => {
    try {
        const { id } = req.params;
        const deleted = await Offer.findByIdAndDelete(id);
        if (!deleted) {
            res.status(404).json({ success: false, message: 'Offer not found' });
            return;
        }
        res.status(200).json({ success: true, message: `Offer "${deleted.title}" deleted successfully` });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
