import express from 'express';
const orderRouter = express.Router();
import {addOrderItems,getOrderById,getMyOrders,
  updateOrderToPaidPayFast,getOrders,getOrderSummary,
  updateOrderToDelivered,updateOrderToPaid,updateOrderToCancelled} from '../controller/orderController.js';
import { protect,admin} from '../middleware/authMiddleware.js';

orderRouter.route('/summary').get(protect,admin,getOrderSummary)
orderRouter.route('/mine').get(protect,getMyOrders)
orderRouter.route('/payfast/itn').post(updateOrderToPaidPayFast)


orderRouter.route('/:id').get(protect,getOrderById)
 orderRouter.route('/:id/pay').put(protect,admin,updateOrderToPaid)
orderRouter.route('/:id/deliver').put(protect,admin,updateOrderToDelivered)
orderRouter.route('/:id/cancel').put(protect,admin,updateOrderToCancelled)


orderRouter.route('/').get(protect,admin,getOrders)
orderRouter.route('/').post(protect,addOrderItems)


export default orderRouter;