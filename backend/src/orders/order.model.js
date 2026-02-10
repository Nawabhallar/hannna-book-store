const mongoose =  require('mongoose');

const orderSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    email:{
        type: String,
        required: true,
    },
    address: {
        city: {
            type: String,
            required: true,
        },
        country: String,
        state: String,
        zipcode: String,
    },
    phone: {
        type: Number,
        required: true,
    },
    productIds:[
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Book',
            required: true,
        }
    ],
    // Snapshot of ordered products to preserve title/price at order time
    products: [
        {
            bookId: { type: mongoose.Schema.Types.ObjectId, ref: 'Book' },
            title: String,
            price: Number,
        }
    ],
    totalPrice: {
        type: Number,
        required: true,
    }
    ,
    status: {
        type: String,
        enum: ['pending', 'received', 'shipped', 'delivered', 'cancelled'],
        default: 'pending',
    }
}, {
    timestamps: true,
})

const Order =  mongoose.model('Order', orderSchema);

module.exports = Order;