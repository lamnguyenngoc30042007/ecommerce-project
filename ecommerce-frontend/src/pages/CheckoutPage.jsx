import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import {
  Container,
  Paper,
  Typography,
  Grid,
  Box,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormControl,
  Button,
  Divider,
  List,
  ListItem,
  ListItemText,
  Alert,
} from "@mui/material";
import LocalShippingIcon from "@mui/icons-material/LocalShipping";
import AccountBalanceIcon from "@mui/icons-material/AccountBalance";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import StorefrontIcon from "@mui/icons-material/Storefront"; // Icon Shop

function CheckoutPage() {
  const [cartItems, setCartItems] = useState([]);
  const [paymentMethod, setPaymentMethod] = useState("cod");
  const [loading, setLoading] = useState(false);
  const [userAddress, setUserAddress] = useState("");
  const [userName, setUserName] = useState("");
  const [userPhone, setUserPhone] = useState("");

  const navigate = useNavigate();

  const MY_BANK = {
    BANK_ID: "MB",
    ACCOUNT_NO: "0823448678", // Thay số của bạn
    TEMPLATE: "compact",
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          navigate("/login");
          return;
        }

        // 1. Lấy thông tin Giỏ hàng (Kèm thông tin người bán)
        // Lưu ý: API /api/cart ở Backend phải có include: { product: { include: { createdBy: true } } }
        const cartRes = await axios.get("http://localhost:3000/api/cart", {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (cartRes.data.length === 0) {
          toast.warning("Giỏ hàng trống!");
          navigate("/");
        }
        setCartItems(cartRes.data);

        // 2. Lấy thông tin User
        const userRes = await axios.get(
          "http://localhost:3000/api/users/profile",
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        setUserAddress(userRes.data.address || "");
        setUserName(userRes.data.full_name || "");
        setUserPhone(userRes.data.phone_number || "");
      } catch (error) {
        console.error(error);
        toast.error("Lỗi tải thông tin thanh toán");
      }
    };
    fetchData();
  }, []);

  // --- HÀM GOM NHÓM SẢN PHẨM THEO SHOP ---
  const groupedItems = cartItems.reduce((acc, item) => {
    const sellerName =
      item.product.createdBy?.full_name || "Cửa hàng chính hãng";
    const sellerId = item.product.createdById || "system";

    if (!acc[sellerId]) {
      acc[sellerId] = { name: sellerName, items: [] };
    }
    acc[sellerId].items.push(item);
    return acc;
  }, {});
  // ---------------------------------------

  const totalPrice = cartItems.reduce((total, item) => {
    return total + Number(item.product.price) * item.quantity;
  }, 0);

  const handlePlaceOrder = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      // Gọi API tách đơn phía Backend
      const res = await axios.post(
        "http://localhost:3000/api/orders/checkout",
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      toast.success(res.data.message || "🎉 Đặt hàng thành công!");
      navigate("/");
    } catch (error) {
      toast.error(error.response?.data?.error || "Lỗi khi đặt hàng");
      if (error.response?.data?.error?.includes("địa chỉ")) {
        setTimeout(() => navigate("/profile"), 2000);
      }
    }
    setLoading(false);
  };

  const qrUrl = `https://img.vietqr.io/image/${MY_BANK.BANK_ID}-${MY_BANK.ACCOUNT_NO}-${MY_BANK.TEMPLATE}.png?amount=${totalPrice}&addInfo=Thanh toan don hang`;

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom fontWeight="bold" align="center">
        Thanh Toán
      </Typography>

      <Grid container spacing={3}>
        {/* --- CỘT TRÁI: THÔNG TIN ĐƠN HÀNG (ĐÃ TÁCH SHOP) --- */}
        <Grid item xs={12} md={6}>
          {/* Địa chỉ nhận hàng */}
          <Paper
            elevation={3}
            sx={{ p: 3, mb: 3, borderLeft: "5px solid #1976d2" }}
          >
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                mb: 1,
                color: "#1976d2",
              }}
            >
              <LocationOnIcon sx={{ mr: 1 }} />
              <Typography variant="h6" fontWeight="bold">
                Địa chỉ nhận hàng
              </Typography>
            </Box>
            {userAddress ? (
              <>
                <Typography variant="subtitle1" fontWeight="bold">
                  {userName} ({userPhone})
                </Typography>
                <Typography variant="body1">{userAddress}</Typography>
              </>
            ) : (
              <Alert severity="error">Bạn chưa có địa chỉ giao hàng!</Alert>
            )}
          </Paper>

          {/* Danh sách đơn hàng (Gom nhóm) */}
          <Typography variant="h6" gutterBottom fontWeight="bold">
            Chi tiết đơn hàng
          </Typography>

          {Object.keys(groupedItems).map((sellerId) => (
            <Paper
              key={sellerId}
              elevation={3}
              sx={{ mb: 2, overflow: "hidden" }}
            >
              {/* Header tên Shop */}
              <Box
                sx={{
                  bgcolor: "#e3f2fd",
                  p: 1.5,
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                }}
              >
                <StorefrontIcon fontSize="small" color="primary" />
                <Typography
                  variant="subtitle2"
                  fontWeight="bold"
                  color="primary"
                >
                  Đơn hàng từ: {groupedItems[sellerId].name}
                </Typography>
              </Box>

              <List dense>
                {groupedItems[sellerId].items.map((item) => (
                  <ListItem key={item.id}>
                    <ListItemText
                      primary={item.product.name}
                      secondary={`Số lượng: ${item.quantity}`}
                    />
                    <Typography variant="body2" fontWeight="bold">
                      {(
                        Number(item.product.price) * item.quantity
                      ).toLocaleString()}{" "}
                      ₫
                    </Typography>
                  </ListItem>
                ))}
              </List>
            </Paper>
          ))}

          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              mt: 3,
              p: 2,
              bgcolor: "#fff",
              borderRadius: 2,
              boxShadow: 1,
            }}
          >
            <Typography variant="h6">Tổng thanh toán:</Typography>
            <Typography variant="h5" color="error" fontWeight="bold">
              {totalPrice.toLocaleString()} ₫
            </Typography>
          </Box>
        </Grid>

        {/* --- CỘT PHẢI: PHƯƠNG THỨC THANH TOÁN --- */}
        <Grid item xs={12} md={6}>
          <Paper elevation={3} sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom fontWeight="bold">
              Hình thức thanh toán
            </Typography>

            <FormControl component="fieldset">
              <RadioGroup
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
              >
                <FormControlLabel
                  value="cod"
                  control={<Radio />}
                  label={
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <LocalShippingIcon color="action" /> Thanh toán khi nhận
                      hàng (COD)
                    </Box>
                  }
                />
                <FormControlLabel
                  value="banking"
                  control={<Radio />}
                  label={
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <AccountBalanceIcon color="primary" /> Chuyển khoản ngân
                      hàng
                    </Box>
                  }
                />
              </RadioGroup>
            </FormControl>

            {paymentMethod === "banking" && (
              <Box
                sx={{
                  mt: 2,
                  textAlign: "center",
                  p: 2,
                  bgcolor: "#f0f4ff",
                  borderRadius: 2,
                }}
              >
                <Typography variant="subtitle2" gutterBottom>
                  Quét mã để thanh toán:
                </Typography>
                <img
                  src={qrUrl}
                  alt="QR Code"
                  style={{ width: "100%", maxWidth: "250px" }}
                />
                <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                  *Nội dung: 0823448678
                </Typography>
              </Box>
            )}

            {userAddress ? (
              <Button
                fullWidth
                variant="contained"
                size="large"
                sx={{ mt: 3 }}
                onClick={handlePlaceOrder}
                disabled={loading}
              >
                {loading ? "Đang xử lý..." : "Xác Nhận Đặt Hàng"}
              </Button>
            ) : (
              <Button
                fullWidth
                variant="contained"
                color="warning"
                size="large"
                sx={{ mt: 3 }}
                onClick={() => navigate("/profile")}
              >
                Cập nhật địa chỉ ngay
              </Button>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
}

export default CheckoutPage;
