import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  Container,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Select,
  MenuItem,
  Chip,
  Box,
} from "@mui/material";
import { toast } from "react-toastify";

function AdminOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [currentUserRole, setCurrentUserRole] = useState("");
  const [currentUserId, setCurrentUserId] = useState(null);

  // Hàm giải mã token đơn giản để lấy ID của mình (không cần cài thêm thư viện)
  const getMyInfo = () => {
    const token = localStorage.getItem("token");
    if (token) {
      try {
        const base64Url = token.split(".")[1];
        const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
        const jsonPayload = decodeURIComponent(
          window
            .atob(base64)
            .split("")
            .map(function (c) {
              return "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2);
            })
            .join("")
        );
        const decoded = JSON.parse(jsonPayload);
        setCurrentUserRole(decoded.role);
        setCurrentUserId(decoded.userId);
      } catch (e) {
        console.error(e);
      }
    }
  };

  const fetchOrders = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get("https://ecommerce-project-i12t.onrender.com/api/admin/orders", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setOrders(response.data);
    } catch (error) {
      console.error(error);
      // toast.error("Lỗi tải danh sách đơn hàng");
    }
  };

  useEffect(() => {
    getMyInfo();
    fetchOrders();
  }, []);

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      const token = localStorage.getItem("token");
      await axios.put(
        `https://ecommerce-project-i12t.onrender.com/api/admin/orders/${orderId}/status`,
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success(`Đã cập nhật đơn #${orderId}`);
      fetchOrders();
    } catch (error) {
      toast.error("Lỗi cập nhật trạng thái");
    }
  };

  return (
    <Container maxWidth="xl" sx={{ mt: 4 }}>
      <Typography variant="h4" gutterBottom fontWeight="bold">
        Quản Lý Đơn Hàng ({currentUserRole === "admin" ? "Toàn hệ thống" : "Của Shop tôi"})
      </Typography>

      <TableContainer component={Paper}>
        <Table>
          <TableHead sx={{ bgcolor: "#f5f5f5" }}>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>Khách hàng</TableCell>
              <TableCell>Sản phẩm</TableCell>
              <TableCell>Tổng tiền</TableCell>
              <TableCell>Ngày đặt</TableCell>
              <TableCell>Trạng thái</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {orders.map((order) => (
              <TableRow key={order.id}>
                <TableCell>#{order.id}</TableCell>

                <TableCell>
                  <Typography fontWeight="bold">{order.user?.full_name || "Đã xóa"}</Typography>
                  <Typography variant="caption" display="block">
                    {order.user?.email}
                  </Typography>
                  <Typography variant="caption" display="block">
                    {order.user?.phone_number}
                  </Typography>
                </TableCell>

                <TableCell>
                  {order.items.map((item, index) => {
                    // KIỂM TRA: Sản phẩm này có phải của tôi không?
                    // Nếu là Admin: Luôn là true
                    // Nếu là Sales: So sánh createdById với currentUserId
                    const isMyProduct = currentUserRole === "admin" || item.product?.createdById === currentUserId;

                    return (
                      <Box
                        key={index}
                        sx={{
                          mb: 0.5,
                          opacity: isMyProduct ? 1 : 0.4, // Làm mờ nếu không phải hàng của mình
                          textDecoration: isMyProduct ? "none" : "line-through", // Hoặc gạch ngang
                        }}
                      >
                        - {item.product?.name} (x{item.quantity})
                        {!isMyProduct && (
                          <Typography component="span" variant="caption" color="error">
                            {" "}
                            (Shop khác)
                          </Typography>
                        )}
                      </Box>
                    );
                  })}
                </TableCell>

                <TableCell sx={{ color: "red", fontWeight: "bold" }}>{Number(order.total_price).toLocaleString()} ₫</TableCell>

                <TableCell>{new Date(order.order_date).toLocaleDateString()}</TableCell>

                <TableCell>
                  <Select
                    size="small"
                    value={order.status}
                    onChange={(e) => handleStatusChange(order.id, e.target.value)}
                    sx={{
                      fontSize: "0.875rem",
                      color: order.status === "cancelled" ? "red" : order.status === "delivered" ? "green" : "orange",
                    }}
                  >
                    <MenuItem value="pending">Chờ xử lý</MenuItem>
                    <MenuItem value="shipped">Đang giao</MenuItem>
                    <MenuItem value="delivered">Đã giao</MenuItem>
                    <MenuItem value="cancelled">Đã hủy</MenuItem>
                  </Select>
                </TableCell>
              </TableRow>
            ))}
            {orders.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  Chưa có đơn hàng nào.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Container>
  );
}

export default AdminOrdersPage;
