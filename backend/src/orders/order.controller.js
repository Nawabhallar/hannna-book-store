const Order = require("./order.model");

// Simple in-memory SSE subscribers registry: map email -> Set of response objects
const subscribers = new Map();

function sendEventToEmail(email, eventName, payload) {
  const set = subscribers.get(email);
  if (!set) return;
  const data = `event: ${eventName}\ndata: ${JSON.stringify(payload)}\n\n`;
  for (const res of set) {
    try {
      res.write(data);
    } catch (e) {
      // ignore broken pipes; cleanup happens on 'close'
      console.error('Failed to write SSE to subscriber', e);
    }
  }
}

const sseSubscribe = async (req, res) => {
  const email = req.query.email;
  if (!email) return res.status(400).json({ message: 'Missing email query param' });

  // Setup SSE headers
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
  });
  res.write('\n');

  let set = subscribers.get(email);
  if (!set) {
    set = new Set();
    subscribers.set(email, set);
  }
  set.add(res);

  req.on('close', () => {
    set.delete(res);
    if (set.size === 0) subscribers.delete(email);
  });
};

const createAOrder = async (req, res) => {
  try {
    // Build products snapshot: prefer client-provided `products` array, otherwise populate from Book ids
    let payload = { ...req.body };
    if (!Array.isArray(payload.products) || payload.products.length === 0) {
      // try to populate product titles/prices from Book collection
      if (Array.isArray(payload.productIds) && payload.productIds.length > 0) {
        // lazy require to avoid circular deps
        const Book = require('../books/book.model');
        const books = await Book.find({ _id: { $in: payload.productIds } });
        payload.products = books.map(b => ({ bookId: b._id, title: b.title, price: b.newPrice }));
      } else {
        payload.products = [];
      }
    }

    // Use 'new' to create a Mongoose document instance
    const newOrder = new Order(payload);
    const savedOrder = await newOrder.save();
    res.status(200).json(savedOrder);

    // Notify subscribers that a new order was created for this email (best-effort)
    try {
      sendEventToEmail(savedOrder.email, 'order-created', savedOrder);
    } catch (e) {
      console.error('Failed to send SSE order-created', e);
    }
  } catch (error) {
    console.error("Error creating order", error);
    res.status(500).json({ message: "Failed to create order" });
  }
};

const getOrderByEmail = async (req, res) => {
  try {
    const {email} = req.params;
  const orders = await Order.find({email}).sort({createdAt: -1}).populate('productIds').exec();
    if(!orders) {
      return res.status(404).json({ message: "Order not found" });
    }
    res.status(200).json(orders);
  } catch (error) {
    console.error("Error fetching orders", error);
    res.status(500).json({ message: "Failed to fetch order" });
  }
}

const getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find({}).sort({createdAt: -1}).populate('productIds').exec();

    // Backfill products snapshot for orders that are missing it (so admin UI can always rely on titles)
    const ordersToBackfill = orders.filter(o => !Array.isArray(o.products) || o.products.length === 0);
    if (ordersToBackfill.length > 0) {
      try {
        const Book = require('../books/book.model');
        // collect unique book ids
        const idSet = new Set();
        for (const o of ordersToBackfill) {
          if (Array.isArray(o.productIds)) {
            for (const p of o.productIds) {
              const id = p && p._id ? p._id.toString() : (p ? p.toString() : null);
              if (id) idSet.add(id);
            }
          }
        }
        const ids = Array.from(idSet);
        const books = ids.length > 0 ? await Book.find({ _id: { $in: ids } }) : [];

        // build snapshot and persist for each order
        for (const o of ordersToBackfill) {
          const snapshot = [];
          if (Array.isArray(o.productIds)) {
            for (const p of o.productIds) {
              const id = p && p._id ? p._id.toString() : (p ? p.toString() : null);
              const book = books.find(b => b._id.toString() === id);
              if (book) snapshot.push({ bookId: book._id, title: book.title, price: book.newPrice });
              else if (id) snapshot.push({ bookId: id, title: null, price: null });
            }
          }
          if (snapshot.length > 0) {
            // persist snapshot
            await Order.findByIdAndUpdate(o._id, { products: snapshot }).exec();
            // also attach to returned object
            o.products = snapshot;
          }
        }
      } catch (e) {
        console.error('Failed to backfill products for orders in getAllOrders', e);
      }
    }

    res.status(200).json(orders);
  } catch (error) {
    console.error('Error fetching all orders', error);
    res.status(500).json({ message: 'Failed to fetch orders' });
  }
}

const updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const allowed = ['pending', 'received', 'shipped', 'delivered', 'cancelled'];
    if (!allowed.includes(status)) return res.status(400).json({ message: 'Invalid status' });
    // Update and return a populated order so clients get book titles (not just ids)
    let updated = await Order.findByIdAndUpdate(id, { status }, { new: true }).populate('productIds').exec();
    if(!updated) return res.status(404).json({ message: 'Order not found' });

    // If this order doesn't have a products snapshot (older orders), build it now
    if (!Array.isArray(updated.products) || updated.products.length === 0) {
      try {
        const Book = require('../books/book.model');
        const bookDocs = [];
        if (Array.isArray(updated.productIds) && updated.productIds.length > 0) {
          // productIds may be populated (documents) or raw ObjectIds
          const ids = updated.productIds.map(p => (p && p._id) ? p._id : p);
          const books = await Book.find({ _id: { $in: ids } });
          const snapshot = books.map(b => ({ bookId: b._id, title: b.title, price: b.newPrice }));
          // save snapshot onto the order document
          updated = await Order.findByIdAndUpdate(id, { products: snapshot }, { new: true }).populate('productIds').exec();
        }
      } catch (e) {
        console.error('Failed to backfill order products snapshot', e);
      }
    }

    // Respond with the populated document which includes both populated productIds and products snapshot
    res.status(200).json(updated);

    // Notify subscribers for this order's email (if any) with the populated order
    try {
      sendEventToEmail(updated.email, 'order-updated', updated);
    } catch (e) {
      console.error('Failed to send SSE order update', e);
    }
  } catch (error) {
    console.error('Error updating order status', error);
    res.status(500).json({ message: 'Failed to update order status' });
  }
}

module.exports = {
  createAOrder,
  getOrderByEmail,
  getAllOrders,
  updateOrderStatus,
  sseSubscribe,
};
