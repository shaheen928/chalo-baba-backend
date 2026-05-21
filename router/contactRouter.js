import express from 'express';
import asyncHandler from "express-async-handler";
 
import Contact from '../models/contactModel.js';
import { admin, protect } from '../middleware/authMiddleware.js';

const contactRouter = express.Router();

 contactRouter.post(
  '/',
  asyncHandler(async (req, res) => {
    const { name, email, message } = req.body;

    if (!name || !email || !message) {
      res.status(400);
      throw new Error('Please fill all fields');
    }

    const contact = await Contact.create({ name, email, message });

    if (contact) {
      res.status(201).json({ message: 'Message sent successfully!' });
    } else {
      res.status(400);
      throw new Error('Invalid data');
    }
  })
);

contactRouter.get('/',protect,admin, asyncHandler(async (req,res) => {
  
const inquiries = await Contact.find({}).sort({createdAt: -1});
res.json(inquiries)
}));
 
contactRouter.delete('/:id',protect,admin, asyncHandler(async (req,res) => {
  const inquiry = await Contact.findById(req.params.id)
  if(inquiry) {
    await Contact.deleteOne({
      _id : req.params.id
    })
    res.json({message: 'Inquiru removed successfully'})
  } else{
    res.status(404);
    throw new Error ('Message Not Found')
  }
}))

export default contactRouter;