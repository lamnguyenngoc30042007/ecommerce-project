import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";

import {
  Container,
  Typography,
  Box,
  Grid,
  Button,
  CircularProgress,
  Alert,
  Paper,
  Divider,
  Chip,
  IconButton,
  TextField,
  Stack,
  Rating,
  Avatar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import AddShoppingCartIcon from "@mui/icons-material/AddShoppingCart";
import FlashOnIcon from "@mui/icons-material/FlashOn";
import RemoveIcon from "@mui/icons-material/Remove";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit"; // Icon sửa

function ProductDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  // State Sản phẩm
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedImage, setSelectedImage] = useState("");
  const [quantity, setQuantity] = useState(1);

  // State Đánh giá (Review)
  const [reviews, setReviews] = useState([]);
  const [currentUserId, setCurrentUserId] = useState(null); // Để biết mình là ai

  // State cho Dialog Sửa đánh giá
  const [openEdit, setOpenEdit] = useState(false);
  const [editRating, setEditRating] = useState(5);
  const [editComment, setEditComment] = useState("");
  const [editingReviewId, setEditingReviewId] = useState(null);

  // 1. Tải dữ liệu (Sản phẩm + Review + User ID)
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError("");
      try {
        // Lấy sản phẩm
        const prodRes = await axios.get(`https://ecommerce-project-i12t.onrender.com/api/products/${id}`);
        setProduct(prodRes.data);

        // Xử lý ảnh mặc định
        if (prodRes.data.image_url) setSelectedImage(prodRes.data.image_url);
        else if (prodRes.data.images?.length > 0) setSelectedImage(prodRes.data.images[0]);
        else setSelectedImage("https://via.placeholder.com/600x400");

        // Lấy danh sách đánh giá
        fetchReviews();

        // Lấy ID người dùng hiện tại (nếu đã đăng nhập)
        const token = localStorage.getItem("token");
        if (token) {
          const profileRes = await axios.get("https://ecommerce-project-i12t.onrender.com/api/users/profile", {
            headers: { Authorization: `Bearer ${token}` },
          });
          setCurrentUserId(profileRes.data.id);
        }
      } catch (err) {
        console.error(err);
        setError("Không thể tải sản phẩm.");
      }
      setLoading(false);
    };
    fetchData();
  }, [id]);

  // Hàm lấy riêng danh sách review (để gọi lại sau khi sửa)
  const fetchReviews = async () => {
    try {
      const res = await axios.get(`https://ecommerce-project-i12t.onrender.com/api/products/${id}/reviews`);
      setReviews(res.data);
    } catch (e) {
      console.error(e);
    }
  };

  const handleDecreaseQuantity = () => {
    if (quantity > 1) setQuantity((prev) => prev - 1);
  };
  const handleIncreaseQuantity = () => {
    if (product && quantity < product.stock_quantity) setQuantity((prev) => prev + 1);
    else toast.warning("Đã đạt giới hạn tồn kho!");
  };

  const handleAddToCart = async (isBuyNow = false) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        toast.warning("Vui lòng đăng nhập!");
        return;
      }
      await axios.post(
        "https://ecommerce-project-i12t.onrender.com/api/cart/add",
        { product_id: product.id, quantity: quantity },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (isBuyNow) navigate("/checkout");
      else toast.success(`Đã thêm ${quantity} sản phẩm vào giỏ!`);
    } catch (error) {
      toast.error("Lỗi thêm giỏ hàng.");
    }
  };

  // --- XỬ LÝ SỬA ĐÁNH GIÁ ---
  const handleOpenEdit = (review) => {
    setEditingReviewId(review.id);
    setEditRating(review.rating);
    setEditComment(review.comment || "");
    setOpenEdit(true);
  };

  const handleSubmitEdit = async () => {
    try {
      const token = localStorage.getItem("token");
      await axios.put(
        `https://ecommerce-project-i12t.onrender.com/api/reviews/${editingReviewId}`,
        { rating: editRating, comment: editComment },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success("Sửa đánh giá thành công!");
      setOpenEdit(false);
      fetchReviews(); // Tải lại danh sách comment
    } catch (error) {
      toast.error("Lỗi khi sửa đánh giá");
    }
  };
  // ---------------------------

  if (loading)
    return (
      <Container sx={{ mt: 10, textAlign: "center" }}>
        <CircularProgress />
      </Container>
    );
  if (error)
    return (
      <Container sx={{ mt: 10 }}>
        <Alert severity="error">{error}</Alert>
      </Container>
    );
  if (!product) return null;

  const allImages = [product.image_url, ...(product.images || [])].filter(Boolean);

  return (
    <Container sx={{ mt: 4, mb: 8 }}>
      <Paper elevation={3} sx={{ padding: 4, mb: 4 }}>
        <Grid container spacing={4}>
          {/* Cột Trái: Ảnh */}
          <Grid item xs={12} md={6}>
            <Box
              component="img"
              src={selectedImage}
              sx={{
                width: "100%",
                height: 400,
                objectFit: "cover",
                borderRadius: 2,
                boxShadow: 3,
                mb: 2,
              }}
            />
            <Grid container spacing={1}>
              {allImages.map((img, idx) => (
                <Grid item xs={3} key={idx}>
                  <Box
                    component="img"
                    src={img}
                    onClick={() => setSelectedImage(img)}
                    sx={{
                      width: "100%",
                      height: 80,
                      objectFit: "cover",
                      borderRadius: 1,
                      cursor: "pointer",
                      border: selectedImage === img ? "3px solid #1976d2" : "none",
                      opacity: selectedImage === img ? 1 : 0.7,
                    }}
                  />
                </Grid>
              ))}
            </Grid>
          </Grid>

          {/* Cột Phải: Thông tin */}
          <Grid item xs={12} md={6}>
            <Typography component="h1" variant="h3" gutterBottom sx={{ fontWeight: "bold" }}>
              {product.name}
            </Typography>
            <Typography variant="subtitle1" color="text.secondary" gutterBottom sx={{ mb: 2 }}>
              Người bán:{" "}
              {product.createdById ? (
                <Button variant="text" onClick={() => navigate(`/seller/${product.createdById}`)} sx={{ fontWeight: "bold", fontSize: "1rem", p: 0 }}>
                  {product.createdBy?.full_name || "Sales Member"}
                </Button>
              ) : (
                <strong>Cửa hàng chính hãng</strong>
              )}
            </Typography>
            <Typography variant="h4" color="primary" gutterBottom sx={{ fontWeight: "bold" }}>
              {Number(product.price).toLocaleString()} VNĐ
            </Typography>
            <Box sx={{ mb: 2 }}>
              {product.stock_quantity > 0 ? (
                <Chip label={`Còn hàng: ${product.stock_quantity}`} color="success" variant="outlined" />
              ) : (
                <Chip label="HẾT HÀNG" color="error" />
              )}
            </Box>
            <Typography variant="body1" paragraph sx={{ mt: 2, color: "text.secondary" }}>
              {product.description}
            </Typography>

            {product.stock_quantity > 0 && (
              <Box
                sx={{
                  mt: 3,
                  mb: 2,
                  display: "flex",
                  alignItems: "center",
                  gap: 2,
                }}
              >
                <Typography fontWeight="bold">Số lượng:</Typography>
                <Stack direction="row" alignItems="center" spacing={1} sx={{ border: "1px solid #ccc", borderRadius: 1, p: 0.5 }}>
                  <IconButton size="small" onClick={handleDecreaseQuantity} disabled={quantity <= 1}>
                    <RemoveIcon fontSize="small" />
                  </IconButton>
                  <TextField
                    value={quantity}
                    size="small"
                    inputProps={{
                      style: {
                        textAlign: "center",
                        width: "40px",
                        padding: "5px",
                      },
                      readOnly: true,
                    }}
                    variant="standard"
                    InputProps={{ disableUnderline: true }}
                  />
                  <IconButton size="small" onClick={handleIncreaseQuantity} disabled={quantity >= product.stock_quantity}>
                    <AddIcon fontSize="small" />
                  </IconButton>
                </Stack>
              </Box>
            )}

            <Stack direction="row" spacing={2} sx={{ mt: 4 }}>
              <Button
                variant="outlined"
                size="large"
                startIcon={<AddShoppingCartIcon />}
                onClick={() => handleAddToCart(false)}
                disabled={product.stock_quantity <= 0}
                sx={{ flex: 1 }}
              >
                Thêm vào giỏ
              </Button>
              <Button
                variant="contained"
                color="error"
                size="large"
                startIcon={<FlashOnIcon />}
                onClick={() => handleAddToCart(true)}
                disabled={product.stock_quantity <= 0}
                sx={{ flex: 1 }}
              >
                Mua Ngay
              </Button>
            </Stack>
          </Grid>
        </Grid>
      </Paper>

      {/* Mô tả chi tiết */}
      {product.detailed_description && (
        <Paper elevation={3} sx={{ padding: 4, mt: 4, mb: 4 }}>
          <Typography component="h2" variant="h5" gutterBottom sx={{ fontWeight: "bold" }}>
            Mô Tả Chi Tiết
          </Typography>
          <Divider sx={{ mb: 2 }} />
          <Typography variant="body1" sx={{ whiteSpace: "pre-wrap", lineHeight: 1.8 }}>
            {product.detailed_description}
          </Typography>
        </Paper>
      )}

      {/* --- PHẦN ĐÁNH GIÁ & BÌNH LUẬN (ĐÃ NÂNG CẤP) --- */}
      <Paper elevation={3} sx={{ padding: 4 }}>
        <Typography component="h2" variant="h5" gutterBottom sx={{ fontWeight: "bold" }}>
          Đánh Giá Từ Khách Hàng ({reviews.length})
        </Typography>
        <Divider sx={{ mb: 3 }} />

        {reviews.length === 0 ? (
          <Typography color="text.secondary">Chưa có đánh giá nào cho sản phẩm này.</Typography>
        ) : (
          <Stack spacing={3}>
            {/* 1. HIỂN THỊ ĐÁNH GIÁ CỦA TÔI (NẾU CÓ) LÊN ĐẦU */}
            {reviews
              .filter((r) => r.userId === currentUserId)
              .map((review) => (
                <Box
                  key={review.id}
                  sx={{
                    display: "flex",
                    gap: 2,
                    bgcolor: "#e3f2fd",
                    p: 2,
                    borderRadius: 2,
                    border: "1px solid #90caf9",
                  }}
                >
                  <Avatar src={review.user?.avatar_url}>{review.user?.full_name?.charAt(0)}</Avatar>
                  <Box sx={{ flexGrow: 1 }}>
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <Box>
                        <Typography fontWeight="bold" color="primary">
                          Đánh giá của bạn
                        </Typography>
                        <Rating value={review.rating} readOnly size="small" />
                        <Typography variant="caption" color="text.secondary" display="block">
                          {new Date(review.createdAt).toLocaleDateString()}
                        </Typography>
                      </Box>
                      <Button size="small" startIcon={<EditIcon />} onClick={() => handleOpenEdit(review)}>
                        Sửa
                      </Button>
                    </Box>
                    <Typography variant="body2" sx={{ mt: 1 }}>
                      {review.comment}
                    </Typography>
                  </Box>
                </Box>
              ))}

            {/* 2. HIỂN THỊ CÁC ĐÁNH GIÁ KHÁC */}
            {reviews
              .filter((r) => r.userId !== currentUserId)
              .map((review) => (
                <Box key={review.id} sx={{ display: "flex", gap: 2 }}>
                  <Avatar src={review.user?.avatar_url}>{review.user?.full_name?.charAt(0)}</Avatar>
                  <Box sx={{ flexGrow: 1 }}>
                    <Box>
                      <Typography fontWeight="bold">{review.user?.full_name}</Typography>
                      <Rating value={review.rating} readOnly size="small" />
                      <Typography variant="caption" color="text.secondary" display="block">
                        {new Date(review.createdAt).toLocaleDateString()}
                      </Typography>
                    </Box>
                    <Typography
                      variant="body2"
                      sx={{
                        mt: 1,
                        bgcolor: "#f5f5f5",
                        p: 1.5,
                        borderRadius: 2,
                      }}
                    >
                      {review.comment}
                    </Typography>
                  </Box>
                </Box>
              ))}
          </Stack>
        )}
      </Paper>

      {/* --- DIALOG SỬA ĐÁNH GIÁ --- */}
      <Dialog open={openEdit} onClose={() => setOpenEdit(false)}>
        <DialogTitle>Sửa đánh giá của bạn</DialogTitle>
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
            <Box>
              <Typography component="legend">Đánh giá sao</Typography>
              <Rating value={editRating} onChange={(e, val) => setEditRating(val)} />
            </Box>
            <TextField label="Nhận xét" multiline rows={3} value={editComment} onChange={(e) => setEditComment(e.target.value)} fullWidth />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenEdit(false)}>Hủy</Button>
          <Button onClick={handleSubmitEdit} variant="contained">
            Lưu thay đổi
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}

export default ProductDetailPage;
