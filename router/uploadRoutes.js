import express from 'express';
 
import { upload } from '../config/cloudinary.js';  

const router = express.Router();

 
router.post('/', upload.single('image'), (req, res) => {
  if (req.file && req.file.path) {
    res.send({
      message: 'Image uploaded successfully',
      image: req.file.path,  
    });
  } else {
    res.status(400).send({ message: 'No file uploaded or upload failed' });
  }
});

export default router;