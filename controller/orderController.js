import asyncHandler from "express-async-handler";
import Order from "../models/orderModel.js";
import Product from "../models/productModel.js";
import User from "../models/userModel.js";


const getOrderById = async (req, res) => {
  const order = await Order.findById(req.params.id).populate(
    "user",
    "name email",
  );
  if (order) {
    res.json(order);
  } else {
    res.status(404);
    throw new Error("order is not found");
  }
};

const getMyOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find({ user: req.user._id });
  res.json(orders);
});

const addOrderItems = asyncHandler(async (req, res) => {
  const {
    orderItems,
    shippingAddress,
    paymentMethod,
    itemsPrice,
    taxPrice,
    shippingPrice,
    totalPrice,
    discount,
    discountAmount,
  } = req.body;
  if (orderItems && orderItems.length === 0) {
    res.status(400);
    throw new Error("No order items");
  } else {
    const order = new Order({
      orderItems: orderItems.map((x) => ({
        ...x,
        product: x._id,
        _id: undefined,
      })),
      user: req.user._id,
      shippingAddress,
      paymentMethod,
      paymentResult: paymentMethod === 'COD' ? {
        id: "COD_" + Math.random().toString(36).substring(2, 7),
        status: "AWAITING_PAYMENT",
        update_time: new Date().toISOString(),
        email_address: req.user.email,
      }:{},
      itemsPrice,
      taxPrice,
      shippingPrice,
      totalPrice,
      discount,
      discountAmount,
    });
    const createdOrder = await order.save();
    res.status(201).json(createdOrder);
  }
});




 




const updateOrderToPaid = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (order) {
    order.isPaid = true;
    order.paidAt = Date.now();
    order.paymentResult = {
      id: "CASH_RECEIVED_" + Math.random().toString(36).substring(2, 7),
      status: "COMPLETE",
      update_time: new Date().toISOString(),
      email_address: order.user ? order.user.email : req.user.email,
    };
    const updatedOrder = await order.save();
    res.json(updatedOrder);
  } else {
    res.status(404);
    throw new Error("order not found");
  }
});

const updateOrderToPaidPayFast = asyncHandler(async (req, res) => {
  const { m_payment_id, pf_payment_id, payment_status } = req.body;

  if (!m_payment_id) {
    console.log("No Payment ID found in PayFast data");
    return res.status(400).send("No Order ID");
  }

  const order = await Order.findById(m_payment_id);

  if (order) {
    if (payment_status === "COMPLETE") {
      order.isPaid = true;
      order.paidAt = Date.now();
      order.paymentResult = {
        id: pf_payment_id,
        status: payment_status,
        update_time: new Date().toLocaleDateString(),
        email_address: req.body.email_address,
      };

      await order.save();
      console.log(`Order ${m_payment_id} marked as Paid via PayFast`);

      return res.status(200).send("OK");
    } else {
      console.log(
        `Payment Status for Order ${m_payment_id} is: ${payment_status}`,
      );
      return res.status(200).send("Payment not complete yet");
    }
  } else {
    console.log(`Order not found: ${m_payment_id}`);
    return res.status(404).send("Order not found");
  }
});

const getOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find({}).populate("user", "id name").sort({createdAt: -1 });
  res.json(orders);
});

const updateOrderToDelivered = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (order) {
    order.isDelivered = true;
    order.deliveredAt = Date.now();

    const updateStockPromises = order.orderItems.map(async (item) => {
      return Product.findByIdAndUpdate(
        item.product,
        { $inc: { countInStock: -item.qty } },
        { runValidators: false },
      );
    });
    await Promise.all(updateStockPromises);
    const updatedOrder = await order.save();
    res.json(updatedOrder);
  } else {
    res.status(404);
    throw new Error("order not found");
  }
});

const updateOrderToCancelled = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (order) {
    order.isCancelled = true;
    order.cancelledAt = new Date();

    const updateStockPromises = order.orderItems.map(async (item) => {
      return Product.findByIdAndUpdate(
        item.product,
        { $inc: { countInStock: item.qty } },
        { runValidators: false },
      );
    });
    await Promise.all(updateStockPromises);

    order.cancellationReason = req.body?.reason || "No reason";
    const updatedOrder = await order.save();
    res.json(updatedOrder);
  } else {
    res.status(404);
    throw new Error("Order not found");
  }
});


const getOrderSummary = asyncHandler(async (req,res) => {
  const orderCount = await Order.countDocuments();
  const userCount = await User.countDocuments();
  const productCount = await Product.countDocuments();

  const totalSalesData = await Order.aggregate([
    {$match: {isPaid : true}},
    {$group: {_id: null,totalSales: {$sum : "$totalPrice"}}}
  ]);




  const totalSales = totalSalesData.length > 0 ?
  totalSalesData[0].totalSales : 0;






  const salesByDate = await Order.aggregate([
    {$match: {isPaid: true}},
    {$group : {_id : {$dateToString : {format: "%Y-%m-%d", date: "$paidAt"}},
  sales: {$sum: "$totalPrice"},
}},
{$sort : {_id : 1}}
  ])

  const recentOrders = await Order.find().sort({createdAt: -1}).limit(5).populate('user','name')


  res.json({
    orderCount,
    userCount,
    productCount,
    totalSales,
    salesByDate,
    recentOrders
  })

})

export {
  addOrderItems,
  getOrderById,
   updateOrderToPaidPayFast,
  getMyOrders,
  getOrders,
  updateOrderToDelivered,
  updateOrderToPaid,
  updateOrderToCancelled,
  getOrderSummary,
 };
