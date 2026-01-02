import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  Container,
  Typography,
  Paper,
  Box,
  Chip,
  Grid,
  Divider,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Rating,
} from "@mui/material";
import { toast } from "react-toastify";

function OrderHistoryPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  // State cho đánh giá
  const [openReview, setOpenReview] = useState(false);
  const [reviewProduct, setReviewProduct] = useState(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) return;

        const response = await axios.get(
          "http://localhost:3000/api/orders/my-history",
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        setOrders(response.data);
      } catch (error) {
        console.error(error);
        // Không toast lỗi ở đây để tránh spam nếu mới vào chưa có đơn
      }
      setLoading(false);
    };
    fetchOrders();
  }, []);

  const getStatusColor = (status) => {
    switch (status) {
      case "pending":
        return "warning";
      case "shipped":
        return "info";
      case "delivered":
        return "success";
      case "cancelled":
        return "error";
      default:
        return "default";
    }
  };

  const handleOpenReview = (product) => {
    setReviewProduct(product);
    setOpenReview(true);
  };

  const handleSubmitReview = async () => {
    try {
      const token = localStorage.getItem("token");
      await axios.post(
        "http://localhost:3000/api/reviews",
        { productId: reviewProduct.id, rating, comment },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success("Đánh giá thành công!");
      setOpenReview(false);
    } catch (error) {
      toast.error(error.response?.data?.error || "Lỗi khi đánh giá");
    }
  };

  if (loading)
    return (
      <Container sx={{ mt: 4 }}>
        <Typography>Đang tải đơn hàng...</Typography>
      </Container>
    );

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom fontWeight="bold">
        Lịch Sử Mua Hàng
      </Typography>

      {orders.length === 0 ? (
        <Typography>Bạn chưa có đơn hàng nào.</Typography>
      ) : (
        orders.map((order) => (
          <Paper
            key={order.id}
            elevation={3}
            sx={{ mb: 3, p: 3, borderRadius: 2 }}
          >
            <Box
              sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}
            >
              <Typography variant="h6">
                Đơn hàng #{order.id} <br />
                <Typography
                  component="span"
                  variant="caption"
                  color="text.secondary"
                >
                  {new Date(order.order_date).toLocaleString()}
                </Typography>
              </Typography>
              <Chip
                label={order.status.toUpperCase()}
                color={getStatusColor(order.status)}
              />
            </Box>

            <Divider sx={{ mb: 2 }} />

            {order.items.map((item) => {
              // --- CHỐNG LỖI: Nếu sản phẩm bị xóa (null), hiển thị placeholder ---
              const product = item.product || {
                name: "Sản phẩm đã bị xóa",
                image_url: "",
              };
              // -------------------------------------------------------------------

              return (
                <Box
                  key={item.id}
                  sx={{ display: "flex", alignItems: "center", mb: 2 }}
                >
                  <img
                    src={product.image_url || "https://via.placeholder.com/50"}
                    alt={product.name}
                    style={{
                      width: 60,
                      height: 60,
                      objectFit: "cover",
                      borderRadius: 5,
                      marginRight: 15,
                    }}
                  />
                  <Box sx={{ flexGrow: 1 }}>
                    <Typography fontWeight="bold">{product.name}</Typography>
                    <Typography variant="body2">
                      Số lượng: {item.quantity} x{" "}
                      {Number(item.price_at_purchase).toLocaleString()} ₫
                    </Typography>
                  </Box>

                  {/* Chỉ hiện nút đánh giá nếu đơn đã giao và sản phẩm còn tồn tại */}
                  {order.status === "delivered" && item.product && (
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={() => handleOpenReview(item.product)}
                    >
                      Đánh giá
                    </Button>
                  )}
                </Box>
              );
            })}

            <Divider sx={{ mt: 2, mb: 2 }} />

            <Box sx={{ textAlign: "right" }}>
              <Typography variant="h6">
                Tổng tiền:{" "}
                <span style={{ color: "#d32f2f" }}>
                  {Number(order.total_price).toLocaleString()} ₫
                </span>
              </Typography>
            </Box>
          </Paper>
        ))
      )}

      {/* Dialog Đánh giá */}
      <Dialog open={openReview} onClose={() => setOpenReview(false)}>
        <DialogTitle>Đánh giá: {reviewProduct?.name}</DialogTitle>
        <DialogContent>
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              gap: 2,
              mt: 1,
              minWidth: 300,
            }}
          >
            <Rating
              value={rating}
              onChange={(e, val) => setRating(val)}
              size="large"
            />
            <TextField
              label="Nhận xét của bạn"
              multiline
              rows={3}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              fullWidth
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenReview(false)}>Hủy</Button>
          <Button onClick={handleSubmitReview} variant="contained">
            Gửi
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}

export default OrderHistoryPage;
