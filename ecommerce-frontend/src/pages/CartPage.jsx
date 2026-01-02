import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import {
  Container,
  Typography,
  Box,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Button,
  Divider,
  Paper,
  Chip,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import ShoppingCartCheckoutIcon from "@mui/icons-material/ShoppingCartCheckout";
import StorefrontIcon from "@mui/icons-material/Storefront"; // Icon Shop

function CartPage() {
  const [cartItems, setCartItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  // 1. Tải giỏ hàng (Đã bao gồm thông tin người bán từ API backend mới sửa hoặc giữ nguyên API cũ cũng được, miễn là Product có createdBy)
  // LƯU Ý: Để Frontend hiển thị được tên Shop, API "GET /api/cart" CŨNG CẦN SỬA.
  // Nhưng để nhanh, ta sửa API GET cart ở backend trước nhé (xem lưu ý dưới code).

  const fetchCartItems = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setIsLoading(false);
        return;
      }

      const response = await axios.get("http://localhost:3000/api/cart", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setCartItems(response.data);
      setIsLoading(false);
    } catch (error) {
      console.error("Lỗi giỏ hàng:", error);
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCartItems();
  }, []);

  const handleRemoveItem = async (cartItemId) => {
    try {
      const token = localStorage.getItem("token");
      await axios.delete(`http://localhost:3000/api/cart/item/${cartItemId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("Đã xóa sản phẩm.");
      fetchCartItems();
    } catch (error) {
      toast.error("Lỗi khi xóa.");
    }
  };

  const handleCheckout = async () => {
    // Logic Checkout giữ nguyên: Chuyển sang trang CheckoutPage
    // Trang CheckoutPage sẽ gọi API tách đơn mà ta vừa viết ở Bước 1
    navigate("/checkout");
  };

  // --- HÀM GOM NHÓM SẢN PHẨM THEO SHOP (FRONTEND) ---
  const groupedItems = cartItems.reduce((acc, item) => {
    // Nếu sản phẩm có người bán thì lấy tên, ko thì là "Cửa hàng chính hãng"
    const sellerName =
      item.product.createdBy?.full_name || "Cửa hàng chính hãng";
    const sellerId = item.product.createdById || "system";

    if (!acc[sellerId]) {
      acc[sellerId] = { name: sellerName, items: [] };
    }
    acc[sellerId].items.push(item);
    return acc;
  }, {});

  const totalPrice = cartItems.reduce(
    (total, item) => total + Number(item.product.price) * item.quantity,
    0
  );

  if (isLoading)
    return (
      <Container>
        <Typography sx={{ mt: 4 }}>Đang tải giỏ hàng...</Typography>
      </Container>
    );

  return (
    <Container component="main" maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Typography
        component="h1"
        variant="h4"
        align="center"
        gutterBottom
        sx={{ fontWeight: "bold" }}
      >
        Giỏ Hàng Của Bạn
      </Typography>

      {cartItems.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: "center" }}>
          <Typography>Giỏ hàng trống.</Typography>
          <Button
            variant="outlined"
            sx={{ mt: 2 }}
            onClick={() => navigate("/")}
          >
            Mua sắm ngay
          </Button>
        </Paper>
      ) : (
        <Box>
          {/* HIỂN THỊ THEO TỪNG SHOP */}
          {Object.keys(groupedItems).map((sellerId) => (
            <Paper
              key={sellerId}
              elevation={3}
              sx={{ mb: 3, overflow: "hidden" }}
            >
              {/* Header của Shop */}
              <Box
                sx={{
                  bgcolor: "#e3f2fd",
                  p: 1.5,
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                }}
              >
                <StorefrontIcon color="primary" />
                <Typography
                  variant="subtitle1"
                  fontWeight="bold"
                  color="primary"
                >
                  {groupedItems[sellerId].name}
                </Typography>
              </Box>

              <List sx={{ pt: 0 }}>
                {groupedItems[sellerId].items.map((item, index) => (
                  <React.Fragment key={item.id}>
                    <ListItem
                      secondaryAction={
                        <Button
                          size="small"
                          color="error"
                          startIcon={<DeleteIcon />}
                          onClick={() => handleRemoveItem(item.id)}
                        >
                          Xóa
                        </Button>
                      }
                    >
                      <ListItemAvatar>
                        <Avatar
                          variant="square"
                          src={item.product.image_url}
                          sx={{ width: 60, height: 60, mr: 2, borderRadius: 1 }}
                        />
                      </ListItemAvatar>
                      <ListItemText
                        primary={
                          <Typography fontWeight="bold">
                            {item.product.name}
                          </Typography>
                        }
                        secondary={
                          <>
                            <Typography variant="body2">
                              Số lượng: {item.quantity}
                            </Typography>
                            <Typography
                              variant="body2"
                              color="primary"
                              fontWeight="bold"
                            >
                              {Number(item.product.price).toLocaleString()} ₫
                            </Typography>
                          </>
                        }
                      />
                    </ListItem>
                    {index < groupedItems[sellerId].items.length - 1 && (
                      <Divider variant="inset" component="li" />
                    )}
                  </React.Fragment>
                ))}
              </List>
            </Paper>
          ))}
        </Box>
      )}

      {cartItems.length > 0 && (
        <Paper
          elevation={3}
          sx={{
            mt: 4,
            p: 3,
            bgcolor: "#f5f5f5",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Box>
            <Typography variant="h6">
              Tổng thanh toán ({cartItems.length} sản phẩm):
            </Typography>
            <Typography variant="h4" color="error" fontWeight="bold">
              {totalPrice.toLocaleString()} ₫
            </Typography>
          </Box>
          <Button
            variant="contained"
            size="large"
            startIcon={<ShoppingCartCheckoutIcon />}
            onClick={handleCheckout}
            sx={{ px: 4, py: 1.5 }}
          >
            Mua Hàng
          </Button>
        </Paper>
      )}
    </Container>
  );
}

export default CartPage;
