import React, { useEffect, useState } from "react";
import axios from "axios";
import getBaseUrl from "../../../utils/baseURL";
import Loading from "../../../components/Loading";

const AdminOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchOrders = async () => {
    try {
      const res = await axios.get(`${getBaseUrl()}/api/orders/all`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      // Normalize response: backend may return array or an object
      const data = res.data;
      // Normalize response into an array of orders
      let arr = [];
      if (Array.isArray(data)) {
        arr = data;
      } else if (data && Array.isArray(data.orders)) {
        arr = data.orders;
      } else if (data && typeof data === "object") {
        // If it's a single order object, wrap it in an array
        // If it's an object with keys that look like order ids, convert to array
        const maybeOrders = Object.values(data).filter(
          (v) => v && (v._id || v.email || v.productIds)
        );
        if (maybeOrders.length > 0) arr = maybeOrders;
        else arr = [data];
      }
      if (!Array.isArray(arr)) {
        console.warn("AdminOrders: normalized response is not array", res.data);
        arr = [];
      }
      setOrders(arr);
    } catch (err) {
      console.error("Failed to fetch admin orders", err);
      // capture helpful error info for UI
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const updateStatus = async (id, status) => {
    try {
      const res = await axios.put(
        `${getBaseUrl()}/api/orders/${id}/status`,
        { status },
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        }
      );
      setOrders((prev) => prev.map((o) => (o._id === id ? res.data : o)));
    } catch (err) {
      console.error("Failed to update status", err);
      alert("Failed to update order status");
    }
  };

  if (loading) return <Loading />;

  const hasOrders = Array.isArray(orders) && orders.length > 0;

  return (
    <div className="bg-white p-6 rounded shadow">
      <h2 className="text-xl font-semibold mb-4">All Orders</h2>
      {error ? (
        <div className="bg-red-50 border border-red-200 p-4 rounded text-sm text-red-700">
          <p className="font-semibold">Failed to load orders.</p>
          <p>{error.response?.data?.message || error.message}</p>
          {(error.response?.status === 401 ||
            error.response?.status === 403) && (
            <p className="mt-2">
              You need to log in as admin to view orders.{" "}
              <a href="/admin" className="text-blue-600 underline">
                Go to Admin Login
              </a>
            </p>
          )}
        </div>
      ) : !hasOrders ? (
        <div>No orders found</div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div key={order._id} className="border p-4 rounded-md">
              <div className="flex items-start">
                <div className="flex-grow">
                  <h3 className="font-medium">Order ID: {order._id}</h3>
                  <p className="text-gray-600">
                    Customer: {order.name} — {order.email} — {order.phone}
                  </p>
                  <p className="text-gray-600">
                    Address: {order.address?.city}, {order.address?.state},{" "}
                    {order.address?.country} {order.address?.zipcode}
                  </p>
                  <p className="text-gray-600">Total: ${order.totalPrice}</p>
                  <p className="text-sm text-gray-500">
                    Placed: {new Date(order.createdAt).toLocaleString()}
                  </p>
                  <p className="mt-2">
                    <strong>Products:</strong>
                  </p>
                  <ul className="pl-4 list-disc">
                    {Array.isArray(order.products) && order.products.length > 0
                      ? order.products.map((p) => {
                          const id =
                            p.bookId || Math.random().toString(36).slice(2, 9);
                          return (
                            <li key={id}>
                              {p.title || `Product ${id.slice(0, 6)}`}{" "}
                              <span className="text-gray-500">
                                - $
                                {p.price?.toFixed
                                  ? p.price.toFixed(2)
                                  : p.price}
                              </span>
                            </li>
                          );
                        })
                      : order.productIds &&
                        order.productIds.map((p) => {
                          const id = (p && (p._id || p)) || "unknown";
                          const title =
                            p && p.title
                              ? p.title
                              : typeof p === "string"
                              ? `Product ${id.slice(0, 6)}`
                              : "Product";
                          return <li key={id}>{title}</li>;
                        })}
                  </ul>
                </div>
                <div className="w-48 pl-4">
                  <p className="font-semibold">
                    Status: <span className="capitalize">{order.status}</span>
                  </p>
                  <div className="mt-3 space-y-2">
                    {order.status !== "received" && (
                      <button
                        onClick={() => updateStatus(order._id, "received")}
                        className="w-full py-1 px-2 bg-green-500 text-white rounded"
                      >
                        Mark Received
                      </button>
                    )}
                    {order.status !== "shipped" && (
                      <button
                        onClick={() => updateStatus(order._id, "shipped")}
                        className="w-full py-1 px-2 bg-yellow-500 text-white rounded"
                      >
                        Mark Shipped
                      </button>
                    )}
                    {order.status !== "delivered" && (
                      <button
                        onClick={() => updateStatus(order._id, "delivered")}
                        className="w-full py-1 px-2 bg-blue-500 text-white rounded"
                      >
                        Mark Delivered
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminOrders;
