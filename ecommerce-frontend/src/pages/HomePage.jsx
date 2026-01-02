import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";

import {
  Grid,
  Card,
  CardMedia,
  CardContent,
  CardActions,
  CardActionArea,
  Typography,
  Button,
  Container,
  List,
  ListItemButton,
  ListItemText,
  Paper,
  Chip,
  Box,
  TextField,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Divider,
  Stack,
} from "@mui/material";
import AddShoppingCartIcon from "@mui/icons-material/AddShoppingCart";
import CategoryIcon from "@mui/icons-material/Category";
import FilterAltIcon from "@mui/icons-material/FilterAlt";
// --- IMPORT ICON MỚI ---
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";

function HomePage() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState(null);
  const [priceRange, setPriceRange] = useState({ min: "", max: "" });
  const [sortOption, setSortOption] = useState("newest");
  const [loading, setLoading] = useState(true);

  // --- STATE CHO VIỆC "XEM THÊM" ---
  const [visibleCount, setVisibleCount] = useState(8); // Mặc định hiện 8 cái
  // ---------------------------------

  const [searchParams] = useSearchParams();
  const searchTerm = searchParams.get("q");
  const navigate = useNavigate();

  useEffect(() => {
    axios
      .get("https://ecommerce-project-i12t.onrender.com/api/categories")
      .then((res) => setCategories(res.data))
      .catch(console.error);
  }, []);

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        let url = "https://ecommerce-project-i12t.onrender.com/api/products";
        const params = [];

        if (searchTerm) {
          url = `https://ecommerce-project-i12t.onrender.com/api/products/search?q=${searchTerm}`;
          setSelectedCategoryId(null);
        } else {
          if (selectedCategoryId) params.push(`categoryId=${selectedCategoryId}`);
          if (priceRange.min) params.push(`minPrice=${priceRange.min}`);
          if (priceRange.max) params.push(`maxPrice=${priceRange.max}`);
          if (sortOption) params.push(`sort=${sortOption}`);
          if (params.length > 0) url += "?" + params.join("&");
        }

        const response = await axios.get(url);
        setProducts(response.data);

        // --- RESET LẠI SỐ LƯỢNG HIỂN THỊ KHI LỌC/TÌM KIẾM ---
        setVisibleCount(8);
        // ---------------------------------------------------
      } catch (error) {
        console.error(error);
      }
      setLoading(false);
    };
    fetchProducts();
  }, [searchTerm, selectedCategoryId, sortOption]); // Bỏ priceRange ra để chờ bấm nút Áp dụng

  const handleApplyFilter = async () => {
    setLoading(true);
    try {
      let url = "https://ecommerce-project-i12t.onrender.com/api/products";
      const params = [];
      if (selectedCategoryId) params.push(`categoryId=${selectedCategoryId}`);
      if (priceRange.min) params.push(`minPrice=${priceRange.min}`);
      if (priceRange.max) params.push(`maxPrice=${priceRange.max}`);
      if (sortOption) params.push(`sort=${sortOption}`);
      if (params.length > 0) url += "?" + params.join("&");

      const response = await axios.get(url);
      setProducts(response.data);
      setVisibleCount(8); // Reset lại khi lọc giá
    } catch (error) {
      console.error(error);
    }
    setLoading(false);
  };

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

  const getCategoryName = () => {
    if (!selectedCategoryId) return "";
    const category = categories.find((c) => c.id === selectedCategoryId);
    return category ? category.name : "";
  };

  // --- HÀM XỬ LÝ NÚT XEM THÊM ---
  const handleLoadMore = () => {
    setVisibleCount((prev) => prev + 4); // Mỗi lần bấm hiện thêm 4 cái
  };
  // ------------------------------

  return (
    <Container maxWidth="xl" sx={{ mt: 3, mb: 4 }}>
      <Stack direction="row" spacing={3} alignItems="flex-start">
        {/* --- CỘT TRÁI --- */}
        <Box
          sx={{
            width: "20%",
            minWidth: "250px",
            flexShrink: 0,
            position: "sticky",
            top: "20px",
          }}
        >
          <Stack spacing={2}>
            {/* Danh Mục */}
            <Paper elevation={3} sx={{ overflow: "hidden" }}>
              <Box
                sx={{
                  p: 1.5,
                  bgcolor: "#1976d2",
                  color: "white",
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                }}
              >
                <CategoryIcon fontSize="small" />
                <Typography variant="subtitle1" fontWeight="bold">
                  Danh Mục
                </Typography>
              </Box>
              <List component="nav" sx={{ p: 0 }} dense>
                <ListItemButton
                  selected={selectedCategoryId === null && !searchTerm}
                  onClick={() => {
                    setSelectedCategoryId(null);
                    navigate("/");
                  }}
                  sx={{ borderBottom: "1px solid #eee" }}
                >
                  <ListItemText primaryTypographyProps={{ fontSize: "0.9rem" }} primary="Tất cả sản phẩm" />
                </ListItemButton>
                {categories.map((cat) => (
                  <ListItemButton
                    key={cat.id}
                    selected={selectedCategoryId === cat.id}
                    onClick={() => setSelectedCategoryId(cat.id)}
                    sx={{ borderBottom: "1px solid #eee" }}
                  >
                    <ListItemText primaryTypographyProps={{ fontSize: "0.9rem" }} primary={cat.name} />
                  </ListItemButton>
                ))}
              </List>
            </Paper>

            {/* Bộ Lọc */}
            <Paper elevation={3} sx={{ p: 2 }}>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                  mb: 2,
                  color: "#1976d2",
                }}
              >
                <FilterAltIcon fontSize="small" />
                <Typography variant="subtitle1" fontWeight="bold">
                  Bộ Lọc
                </Typography>
              </Box>
              <FormControl fullWidth size="small" sx={{ mb: 2 }}>
                <InputLabel sx={{ fontSize: "0.9rem" }}>Sắp xếp</InputLabel>
                <Select value={sortOption} label="Sắp xếp" onChange={(e) => setSortOption(e.target.value)} sx={{ fontSize: "0.9rem" }}>
                  <MenuItem value="newest">Mới nhất</MenuItem>
                  <MenuItem value="price_asc">Giá: Thấp đến Cao</MenuItem>
                  <MenuItem value="price_desc">Giá: Cao đến Thấp</MenuItem>
                </Select>
              </FormControl>
              <Divider sx={{ mb: 2 }} />
              <Typography variant="caption" gutterBottom>
                Khoảng giá (VNĐ)
              </Typography>
              <Box sx={{ display: "flex", gap: 1, mb: 2 }}>
                <TextField
                  placeholder="Từ"
                  size="small"
                  type="number"
                  value={priceRange.min}
                  onChange={(e) => setPriceRange({ ...priceRange, min: e.target.value })}
                  inputProps={{ style: { fontSize: "0.85rem" } }}
                />
                <TextField
                  placeholder="Đến"
                  size="small"
                  type="number"
                  value={priceRange.max}
                  onChange={(e) => setPriceRange({ ...priceRange, max: e.target.value })}
                  inputProps={{ style: { fontSize: "0.85rem" } }}
                />
              </Box>
              <Button variant="contained" size="small" fullWidth onClick={handleApplyFilter}>
                Áp dụng
              </Button>
            </Paper>
          </Stack>
        </Box>

        {/* --- CỘT PHẢI --- */}
        <Box sx={{ flexGrow: 1 }}>
          <Typography variant="h5" gutterBottom sx={{ fontWeight: "bold", color: "#333", mb: 2 }}>
            {searchTerm ? `Kết quả: "${searchTerm}"` : selectedCategoryId ? `Danh mục: ${getCategoryName()}` : "Tất cả sản phẩm"}
          </Typography>

          {!loading && products.length === 0 && (
            <Paper sx={{ p: 4, textAlign: "center", bgcolor: "#f9f9f9" }}>
              <Typography variant="body1" color="text.secondary">
                Không tìm thấy sản phẩm nào.
              </Typography>
            </Paper>
          )}

          <Grid container spacing={2}>
            {/* CHỈ HIỂN THỊ SỐ LƯỢNG SẢN PHẨM THEO visibleCount */}
            {products.slice(0, visibleCount).map((product) => (
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
                      <Typography gutterBottom variant="subtitle1" component="div" noWrap sx={{ fontWeight: "bold", fontSize: "0.95rem" }}>
                        {product.name}
                      </Typography>
                      <Typography variant="body2" color="primary" fontWeight="bold">
                        {Number(product.price).toLocaleString()} ₫
                      </Typography>
                      <Box sx={{ mt: 0.5 }}>
                        {product.stock_quantity > 0 ? (
                          <Typography variant="caption" sx={{ color: "green", fontWeight: "bold" }}>
                            Còn: {product.stock_quantity}
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
                      sx={{ fontSize: "0.75rem", textTransform: "none" }}
                    >
                      {product.stock_quantity > 0 ? "Thêm" : "Hết"}
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>

          {/* --- NÚT XEM THÊM --- */}
          {/* Chỉ hiện khi số sản phẩm đang hiện < tổng sản phẩm */}
          {visibleCount < products.length && (
            <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
              <Button variant="outlined" onClick={handleLoadMore} endIcon={<KeyboardArrowDownIcon />} sx={{ borderRadius: 5, px: 4 }}>
                Xem thêm sản phẩm
              </Button>
            </Box>
          )}
          {/* ------------------- */}
        </Box>
      </Stack>
    </Container>
  );
}

export default HomePage;
