import type { Request, Response } from 'express';
import { CMSConfig } from '../models/CMS.js';
import { broadcastCMSUpdated } from '../sockets/socket.js';

export const getCMSConfig = async (req: Request, res: Response): Promise<void> => {
  try {
    const type = String(req.params.type);
    const config = await CMSConfig.findOne({ key: type });

    if (!config) {
      res.status(200).json({ success: true, key: type, data: null });
      return;
    }

    res.status(200).json({ success: true, key: type, data: config.data });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const saveCMSConfig = async (req: Request, res: Response): Promise<void> => {
  try {
    const type = String(req.params.type);
    const { data } = req.body;

    const config = await CMSConfig.findOneAndUpdate(
      { key: type },
      { key: type, data, updatedAt: new Date() },
      { upsert: true, new: true }
    );

    broadcastCMSUpdated(type);

    res.status(200).json({
      success: true,
      message: `CMS configuration for ${type} updated successfully`,
      data: config.data
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const resetCMSConfig = async (req: Request, res: Response): Promise<void> => {
  try {
    const type = String(req.params.type);
    await CMSConfig.findOneAndDelete({ key: type });

    broadcastCMSUpdated(type);

    res.status(200).json({
      success: true,
      message: `CMS configuration for ${type} reset to defaults`
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
