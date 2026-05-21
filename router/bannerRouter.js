import fs from "fs";
import path from "path";

import express from 'express'
import asyncHandler from 'express-async-handler';
import { admin, protect } from '../middleware/authMiddleware.js';
import Banner from '../models/bannerModel.js';
const bannerRouter = express.Router();



bannerRouter.route('/').get( asyncHandler(async (req,res) => {
 const banners = await Banner.find({})
 res.json(banners)
}))
.post(protect,admin,asyncHandler(async (req,res) => {
  const {title,subtitle,image,link} = req.body;
  const banner = new Banner({title,subtitle, image,link: link || ''})
  const createBanner = banner.save();
  res.status(201).json(createBanner)
}))
bannerRouter.route('/:id').delete(protect,admin,asyncHandler(async (req,res) => {
  const banner = await Banner.findById(req.params.id)
  if(banner) {



 const __dirname = path.resolve();
    const imageRelativePath = banner.image.startsWith("/")
      ? banner.image.substring(1)
      : banner.image;
    const oldImagePath = path.join(__dirname, imageRelativePath);
    if (fs.existsSync(oldImagePath)) {
      try {
        fs.unlinkSync(oldImagePath);
      } catch (error) {
        console.error("error deleting file ", error);
      }
    }



    await Banner.deleteOne({_id: req.params.id})
    res.json({message: 'Banner removed successfully'})
  }else{
    res.status(404)
    throw new Error('Banner not found')
  }
}))

export default bannerRouter;