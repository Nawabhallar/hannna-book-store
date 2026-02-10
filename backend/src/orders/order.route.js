const express = require('express');
const { createAOrder, getOrderByEmail, getAllOrders, updateOrderStatus, sseSubscribe } = require('./order.controller');
const verifyAdminToken = require('../middleware/verifyAdminToken');

const router =  express.Router();

// create order endpoint (public)
router.post("/", createAOrder);

// get orders by user email (private to user)
router.get("/email/:email", getOrderByEmail);

// admin: get all orders
router.get('/all', verifyAdminToken, getAllOrders);

// server-sent events subscription for order updates (clients supply ?email=...)
router.get('/subscribe', sseSubscribe);

// admin: update order status
router.put('/:id/status', verifyAdminToken, updateOrderStatus);

module.exports = router;