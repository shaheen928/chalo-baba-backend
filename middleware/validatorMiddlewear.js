import {body,validationResult} from 'express-validator'

const validate = (req,res,next) => {



  const errors= validationResult(req);
  if(errors.isEmpty()) {
    return next() 
  }
  res.status(400).json({
    message: errors.array()[0].msg})

}

export const registerValidator = [
  body('name').notEmpty().withMessage('name is required'),
  body('email').isEmail().withMessage('provide the correct email'),
  body('password').isLength({min:6}).withMessage('The password must be 6 digits'),
  validate
]
export const loginValidator= [
  body('email').isEmail().withMessage('Write valid email'),
  body('password').notEmpty().withMessage('password is required'),
  validate
]