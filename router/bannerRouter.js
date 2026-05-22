import { v2 as cloudinary } from 'cloudinary';

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
  const createBanner = await banner.save();
  res.status(201).json(createBanner)
}))
bannerRouter.route('/:id').delete(protect,admin,asyncHandler(async (req,res) => {
  const banner = await Banner.findById(req.params.id)
  if(banner) {

    if (banner.image && banner.image.includes('cloudinary.com')) {
      try {
         const urlParts = banner.image.split('/');
        const folderAndFileName = urlParts.slice(-2).join('/');  
        const publicId = folderAndFileName.split('.')[0];  

         await cloudinary.uploader.destroy(publicId);
        console.log('Image deleted from Cloudinary successfully');
      } catch (cloudinaryError) {
        console.error('Cloudinary image delete failed:', cloudinaryError);
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