import React from "react";
import { useAuth } from "../../../context/AuthContext";
import { useGetOrderByEmailQuery } from "../../../redux/features/orders/ordersApi";

const UserDashboard = () => {
  const { currentUser } = useAuth();
  const {
    data: orders = [],
    isLoading,
    isError,
  } = useGetOrderByEmailQuery(currentUser?.email, {
    skip: !currentUser?.email,
  });

  if (isLoading) return <div>Loading...</div>;
  if (isError) return <div>Error getting orders data</div>;

  const formatDate = (d) => (d ? new Date(d).toLocaleDateString() : "Unknown");
  const formatDateTime = (d) => (d ? new Date(d).toLocaleString() : "Unknown");

  return (
    <div className="bg-gray-100 py-16">
      <div className="max-w-4xl mx-auto bg-white shadow-md rounded-lg p-6">
        <h1 className="text-2xl font-bold mb-4">User Dashboard</h1>
        <p className="text-gray-700 mb-6">
          Welcome, {currentUser?.name || "User"}! Here are your recent orders:
        </p>

        <div className="mt-6">
          <h2 className="text-xl font-semibold mb-4">Your Orders</h2>

          {orders.length > 0 ? (
            <ul className="space-y-4">
              {orders.map((order) => {
                const createdAt = order.createdAt || order.createdAt;
                // compute estimated window
                let estStart = null;
                let estEnd = null;
                if (createdAt) {
                  const c = new Date(createdAt);
                  estStart = new Date(c);
                  estStart.setDate(estStart.getDate() + 7);
                  estEnd = new Date(c);
                  estEnd.setDate(estEnd.getDate() + 14);
                }

                return (
                  <li
                    key={order._id}
                    className="bg-gray-50 p-4 rounded-lg shadow-sm"
                  >
                    <p className="font-medium">Order ID: {order._id}</p>
                    <p>Date: {formatDate(createdAt)}</p>
                    <p>Total: ${order.totalPrice}</p>
                    <p className="text-gray-600">
                      Status:{" "}
                      <strong className="capitalize">
                        {order.status || "pending"}
                      </strong>
                    </p>
                    <p className="text-sm text-gray-500">
                      Last update:{" "}
                      {formatDateTime(order.updatedAt || order.createdAt)}
                    </p>

                    {/* Estimated delivery window (shown only when not delivered) */}
                    {estStart && estEnd && order.status !== "delivered" && (
                      <div className="mt-3 p-3 bg-yellow-50 border-l-4 border-yellow-400 rounded">
                        <p className="text-sm">
                          Estimated delivery:{" "}
                          <strong>
                            {estStart.toLocaleDateString()} -{" "}
                            {estEnd.toLocaleDateString()}
                          </strong>
                        </p>
                        <p className="text-xs text-gray-600">
                          Typically delivered within 7–14 days from order date.
                        </p>
                      </div>
                    )}

                    <div className="mt-3">
                      <h4 className="font-semibold">Products:</h4>
                      <ul className="ml-4 list-disc">
                        {Array.isArray(order.products) &&
                        order.products.length > 0 ? (
                          order.products.map((p) => {
                            const id =
                              p.bookId ||
                              Math.random().toString(36).slice(2, 9);
                            return (
                              <li key={id}>
                                {p.title}{" "}
                                <span className="text-gray-500">
                                  - $
                                  {p.price?.toFixed
                                    ? p.price.toFixed(2)
                                    : p.price}
                                </span>
                              </li>
                            );
                          })
                        ) : Array.isArray(order.productIds) &&
                          order.productIds.length > 0 ? (
                          order.productIds.map((p) => {
                            const id =
                              (p && (p._id || p)) ||
                              Math.random().toString(36).slice(2, 9);
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
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="text-gray-600">You have no recent orders.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserDashboard;
