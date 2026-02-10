import React, { useEffect, useRef } from "react";
import { useGetOrderByEmailQuery } from "../../redux/features/orders/ordersApi";
import { useAuth } from "../../context/AuthContext";
import getBaseUrl from "../../utils/baseURL";

const OrderPage = () => {
  const { currentUser } = useAuth();

  // use RTK Query with skip while we don't have an email
  const {
    data: orders = [],
    isLoading,
    isError,
    refetch,
  } = useGetOrderByEmailQuery(currentUser?.email, {
    skip: !currentUser?.email,
  });
  const esRef = useRef(null);

  useEffect(() => {
    if (!currentUser?.email) return;

    try {
      const url = `${getBaseUrl()}/api/orders/subscribe?email=${encodeURIComponent(
        currentUser.email
      )}`;
      const es = new EventSource(url);
      esRef.current = es;

      es.addEventListener("order-updated", (e) => {
        try {
          const payload = JSON.parse(e.data);
          // If the update is for this user, refetch their orders
          if (payload && payload.email === currentUser.email) {
            refetch && refetch();
          }
        } catch (err) {
          console.error("Failed to parse SSE order-updated payload", err);
        }
      });

      es.onerror = (err) => {
        console.error("SSE connection error", err);
        // EventSource will auto-retry; nothing else required here
      };

      return () => {
        try {
          es.close();
        } catch (e) {
          /* ignore */
        }
      };
    } catch (err) {
      console.error("Failed to open SSE for order updates", err);
    }
  }, [currentUser?.email, refetch]);
  if (isLoading) return <div>Loading...</div>;
  if (isError) return <div>Error geting orders data</div>;
  return (
    <div className="container mx-auto p-6">
      <h2 className="text-2xl font-semibold mb-4">Your Orders</h2>
      {orders.length === 0 ? (
        <div>No orders found!</div>
      ) : (
        <div>
          {orders.map((order, index) => (
            <div key={order._id} className="border-b mb-4 pb-4">
              <p className="p-1 bg-secondary text-white w-10 rounded mb-1">
                # {index + 1}
              </p>
              <h2 className="font-bold">Order ID: {order._id}</h2>
              <p className="text-gray-600">Name: {order.name}</p>
              <p className="text-gray-600">Email: {order.email}</p>
              <p className="text-gray-600">Phone: {order.phone}</p>
              <p className="text-gray-600">Total Price: ${order.totalPrice}</p>
              <p className="text-gray-600">
                Status:{" "}
                <strong className="capitalize">
                  {order.status || "pending"}
                </strong>
              </p>
              <p className="text-sm text-gray-500">
                Last update:{" "}
                {order.updatedAt
                  ? new Date(order.updatedAt).toLocaleString()
                  : new Date(order.createdAt).toLocaleString()}
              </p>
              {/* Estimated delivery window: 7 - 14 days from order creation */}
              {order &&
                order.createdAt &&
                order.status !== "delivered" &&
                (() => {
                  const created = new Date(order.createdAt);
                  const start = new Date(created);
                  start.setDate(start.getDate() + 7);
                  const end = new Date(created);
                  end.setDate(end.getDate() + 14);
                  const fmt = (d) => d.toLocaleDateString();
                  return (
                    <div className="mt-3 p-3 bg-yellow-50 border-l-4 border-yellow-400 rounded">
                      <p className="text-sm">
                        Estimated delivery:{" "}
                        <strong>
                          {fmt(start)} - {fmt(end)}
                        </strong>
                      </p>
                      <p className="text-xs text-gray-600">
                        Typically delivered within 7–14 days from order date.
                      </p>
                    </div>
                  );
                })()}
              <h3 className="font-semibold mt-2">Address:</h3>
              <p>
                {" "}
                {order.address.city}, {order.address.state},{" "}
                {order.address.country}, {order.address.zipcode}
              </p>
              <h3 className="font-semibold mt-2">Products:</h3>
              <ul>
                {Array.isArray(order.products) && order.products.length > 0 ? (
                  order.products.map((p) => {
                    const id =
                      p.bookId || Math.random().toString(36).slice(2, 9);
                    const title = p.title || `Product ${id.slice(0, 6)}`;
                    return (
                      <li key={id}>
                        {title}{" "}
                        <span className="text-gray-500">
                          - ${p.price?.toFixed ? p.price.toFixed(2) : p.price}
                        </span>
                      </li>
                    );
                  })
                ) : Array.isArray(order.productIds) &&
                  order.productIds.length > 0 ? (
                  order.productIds.map((p) => {
                    const id = (p && (p._id || p)) || "unknown";
                    const title =
                      p && p.title
                        ? p.title
                        : typeof p === "string"
                        ? `Product ${id.slice(0, 6)}`
                        : "Product";
                    return <li key={id}>{title}</li>;
                  })
                ) : (
                  <li>No products listed</li>
                )}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default OrderPage;
