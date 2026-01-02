import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify"; // <--- ĐÃ THÊM DÒNG QUAN TRỌNG NÀY

import {
  Container,
  Typography,
  Grid,
  Paper,
  Avatar,
  Box,
  Divider,
  Card,
  CardMedia,
  CardContent,
  CardActionArea,
  CardActions,
  Button,
  Chip,
} from "@mui/material";
import StorefrontIcon from "@mui/icons-material/Storefront";
import AddShoppingCartIcon from "@mui/icons-material/AddShoppingCart";
import EmailIcon from "@mui/icons-material/Email";
import PhoneIcon from "@mui/icons-material/Phone";

function SellerPage() {
  const { id } = useParams();
  const [seller, setSeller] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const sellerRes = await axios.get(`https://ecommerce-project-i12t.onrender.com/api/users/public/${id}`);
        setSeller(sellerRes.data);

        const productsRes = await axios.get(`https://ecommerce-project-i12t.onrender.com/api/products?sellerId=${id}`);
        setProducts(productsRes.data);
      } catch (error) {
        console.error("Lỗi tải trang người bán", error);
      }
      setLoading(false);
    };
    fetchData();
  }, [id]);

  const handleAddToCart = async (productId) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        toast.warning("Vui lòng đăng nhập để mua hàng!");
        return;
      }
      await axios.post(
        "https://ecommerce-project-i12t.onrender.com/api/cart/add",
        { product_id: productId, quantity: 1 },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success("Đã thêm vào giỏ hàng!");
    } catch (error) {
      toast.error("Lỗi khi thêm vào giỏ hàng.");
    }
  };

  if (loading) return <Container sx={{ mt: 4 }}>Đang tải...</Container>;
  if (!seller) return <Container sx={{ mt: 4 }}>Người bán không tồn tại.</Container>;

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      {/* --- PHẦN 1: THÔNG TIN GIAN HÀNG --- */}
      <Paper
        elevation={3}
        sx={{
          p: 4,
          mb: 4,
          background: "linear-gradient(to right, #e3f2fd, #ffffff)",
        }}
      >
        <Grid container spacing={3} alignItems="center">
          <Grid item>
            <Avatar
              src={seller.avatar_url}
              sx={{
                width: 100,
                height: 100,
                border: "4px solid white",
                boxShadow: 2,
              }}
            >
              {seller.full_name?.charAt(0)}
            </Avatar>
          </Grid>
          <Grid item>
            <Typography variant="h4" fontWeight="bold" sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <StorefrontIcon fontSize="large" /> {seller.full_name}
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ display: "flex", alignItems: "center", gap: 1, mt: 1 }}>
              <EmailIcon fontSize="small" /> {seller.email}
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <PhoneIcon fontSize="small" /> {seller.phone_number || "Chưa cập nhật SĐT"}
            </Typography>
            <Chip label={`Đã đăng bán ${products.length} sản phẩm`} color="primary" sx={{ mt: 2 }} />
          </Grid>
        </Grid>
      </Paper>

      {/* --- PHẦN 2: DANH SÁCH SẢN PHẨM --- */}
      <Typography variant="h5" fontWeight="bold" gutterBottom>
        Sản phẩm của Shop
      </Typography>
      <Divider sx={{ mb: 3 }} />

      <Grid container spacing={2}>
        {products.map((product) => (
          <Grid item key={product.id} xs={6} sm={4} md={3} lg={2.4}>
            <Card
              sx={{
                height: "100%",
                display: "flex",
                flexDirection: "column",
                position: "relative",
                "&:hover": { boxShadow: 6 },
              }}
            >
              <CardActionArea
                onClick={() => navigate(`/product/${product.id}`)}
                sx={{
                  flexGrow: 1,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "start",
                }}
              >
                <CardMedia
                  component="img"
                  height="160"
                  image={product.image_url || "https://via.placeholder.com/300"}
                  alt={product.name}
                  sx={{ objectFit: "contain", p: 1 }}
                />
                <CardContent sx={{ width: "100%", p: 1.5 }}>
                  <Typography gutterBottom variant="subtitle1" component="div" noWrap sx={{ fontWeight: "bold" }}>
                    {product.name}
                  </Typography>
                  <Typography variant="body2" color="primary" fontWeight="bold">
                    {Number(product.price).toLocaleString()} ₫
                  </Typography>
                  <Box sx={{ mt: 0.5 }}>
                    {product.stock_quantity > 0 ? (
                      <Typography variant="caption" sx={{ color: "green", fontWeight: "bold" }}>
                        Còn hàng: {product.stock_quantity}
                      </Typography>
                    ) : (
                      <Chip label="HẾT HÀNG" color="error" size="small" sx={{ height: 20, fontSize: "0.7rem" }} />
                    )}
                  </Box>
                </CardContent>
              </CardActionArea>
              <CardActions sx={{ p: 1, pt: 0, justifyContent: "center" }}>
                <Button
                  variant="contained"
                  fullWidth
                  size="small"
                  startIcon={<AddShoppingCartIcon fontSize="small" />}
                  onClick={() => handleAddToCart(product.id)}
                  disabled={product.stock_quantity <= 0}
                  sx={{ fontSize: "0.75rem" }}
                >
                  {product.stock_quantity > 0 ? "Thêm" : "Hết"}
                </Button>
              </CardActions>
            </Card>
          </Grid>
        ))}
        {products.length === 0 && <Typography sx={{ ml: 2, mt: 2 }}>Người bán này chưa có sản phẩm nào.</Typography>}
      </Grid>
    </Container>
  );
}

export default SellerPage;
