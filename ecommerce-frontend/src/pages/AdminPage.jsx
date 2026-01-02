import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  Container,
  TextField,
  Button,
  Typography,
  Paper,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  MenuItem,
  Select,
  InputLabel,
  FormControl,
  Avatar,
  Box,
  Chip,
  Tooltip,
  DialogContentText,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import AddCircleIcon from "@mui/icons-material/AddCircle";
import AddBoxIcon from "@mui/icons-material/AddBox";
import WarningIcon from "@mui/icons-material/Warning"; // Icon cảnh báo
import { toast } from "react-toastify";
import ReceiptIcon from "@mui/icons-material/Receipt";
import { useNavigate } from "react-router-dom";

function AdminPage() {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);

  // State cho Dialog Sản phẩm
  const [open, setOpen] = useState(false);
  // State cho Dialog Danh mục
  const [openCatDialog, setOpenCatDialog] = useState(false);
  // State cho Dialog XÓA (Mới)
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [deleteProductId, setDeleteProductId] = useState(null);

  const [newCategoryName, setNewCategoryName] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const userRole = localStorage.getItem("role");

  const [formData, setFormData] = useState({
    id: "",
    name: "",
    price: "",
    stock_quantity: "",
    description: "",
    image_url: "",
    category_id: "",
    detailed_description: "",
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem("token");
      const resProducts = await axios.get("https://ecommerce-project-i12t.onrender.com/api/admin/products", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setProducts(resProducts.data);
      fetchCategories();
    } catch (error) {
      console.error("Lỗi tải dữ liệu", error);
    }
  };

  const fetchCategories = async () => {
    try {
      const resCats = await axios.get("https://ecommerce-project-i12t.onrender.com/api/categories");
      setCategories(resCats.data);
    } catch (error) {
      console.error(error);
    }
  };

  // --- XỬ LÝ TẠO DANH MỤC ---
  const handleOpenCatDialog = () => {
    setNewCategoryName("");
    setOpenCatDialog(true);
  };
  const handleSubmitCategory = async () => {
    if (!newCategoryName.trim()) {
      toast.warning("Vui lòng nhập tên danh mục");
      return;
    }
    try {
      const token = localStorage.getItem("token");
      const response = await axios.post(
        "https://ecommerce-project-i12t.onrender.com/api/categories",
        { name: newCategoryName },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success(`Đã tạo: ${newCategoryName}`);
      await fetchCategories();
      setFormData((prev) => ({ ...prev, category_id: response.data.id }));
      setOpenCatDialog(false);
    } catch (error) {
      toast.error(error.response?.data?.error || "Lỗi tạo danh mục");
    }
  };

  // --- XỬ LÝ FORM SẢN PHẨM ---
  const handleOpen = (product = null) => {
    if (product) {
      setIsEditing(true);
      setFormData({
        id: product.id,
        name: product.name,
        price: product.price,
        stock_quantity: product.stock_quantity,
        description: product.description || "",
        detailed_description: product.detailed_description || "",
        image_url: product.image_url || "",
        category_id: product.category_id || "",
      });
    } else {
      setIsEditing(false);
      setFormData({
        id: "",
        name: "",
        price: "",
        stock_quantity: "",
        description: "",
        detailed_description: "",
        image_url: "",
        category_id: "",
      });
    }
    setOpen(true);
  };

  const handleClose = () => setOpen(false);
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async () => {
    const token = localStorage.getItem("token");
    try {
      const payload = {
        ...formData,
        price: parseFloat(formData.price),
        stock_quantity: parseInt(formData.stock_quantity),
        category_id: parseInt(formData.category_id),
      };

      if (isEditing) {
        await axios.put(`https://ecommerce-project-i12t.onrender.com/api/products/${formData.id}`, payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
        toast.success("Cập nhật thành công!");
      } else {
        await axios.post("https://ecommerce-project-i12t.onrender.com/api/products", payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
        toast.success("Thêm mới thành công!");
      }
      fetchData();
      handleClose();
    } catch (error) {
      toast.error("Lỗi: " + (error.response?.data?.error || "Có lỗi xảy ra"));
    }
  };

  // --- XỬ LÝ XÓA (DÙNG DIALOG MỚI) ---
  const confirmDelete = (id) => {
    setDeleteProductId(id);
    setOpenDeleteDialog(true);
  };

  const handleDelete = async () => {
    const token = localStorage.getItem("token");
    try {
      await axios.delete(`https://ecommerce-project-i12t.onrender.com/api/products/${deleteProductId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("Đã xóa sản phẩm!");
      fetchData();
    } catch (error) {
      toast.error("Lỗi: " + (error.response?.data?.error || "Không thể xóa"));
    }
    setOpenDeleteDialog(false);
  };

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Paper sx={{ p: 3 }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", mb: 3 }}>
          <Typography variant="h4">
            Quản Lý Sản Phẩm
            <Typography component="span" variant="h6" color="text.secondary" sx={{ ml: 2 }}>
              ({userRole === "admin" ? "Toàn bộ hệ thống" : "Gian hàng của tôi"})
            </Typography>
          </Typography>
          {/* 1. NÚT CHUYỂN SANG TRANG ĐƠN HÀNG (MỚI) */}
          {userRole === "admin" && (
            <Button variant="outlined" startIcon={<ReceiptIcon />} onClick={() => navigate("/admin/orders")}>
              Xem Đơn Hàng
            </Button>
          )}
          <Button variant="contained" startIcon={<AddCircleIcon />} onClick={() => handleOpen(null)}>
            Thêm Sản Phẩm
          </Button>
        </Box>

        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: "#f5f5f5" }}>
                <TableCell>Ảnh</TableCell>
                <TableCell>Tên</TableCell>
                {userRole === "admin" && <TableCell>Người đăng</TableCell>}
                <TableCell>Giá</TableCell>
                <TableCell>Kho</TableCell>
                <TableCell align="right">Hành động</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {products.map((product) => (
                <TableRow key={product.id}>
                  <TableCell>
                    <Avatar variant="square" src={product.image_url} sx={{ width: 50, height: 50 }} />
                  </TableCell>
                  <TableCell>{product.name}</TableCell>
                  {userRole === "admin" && (
                    <TableCell>
                      {product.createdBy ? (
                        <Chip label={product.createdBy.full_name || product.createdBy.email} size="small" />
                      ) : (
                        <Chip label="Hệ thống" size="small" variant="outlined" />
                      )}
                    </TableCell>
                  )}
                  <TableCell>{Number(product.price).toLocaleString()}đ</TableCell>
                  <TableCell>{product.stock_quantity}</TableCell>
                  <TableCell align="right">
                    <IconButton color="primary" onClick={() => handleOpen(product)}>
                      <EditIcon />
                    </IconButton>
                    {/* GỌI HÀM confirmDelete THAY VÌ handleDelete TRỰC TIẾP */}
                    <IconButton color="error" onClick={() => confirmDelete(product.id)}>
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
              {products.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    Bạn chưa đăng sản phẩm nào.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* --- DIALOG SẢN PHẨM --- */}
      <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
        <DialogTitle>{isEditing ? "Sửa Sản Phẩm" : "Thêm Sản Phẩm Mới"}</DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={3}>
            <Grid item xs={8}>
              <TextField fullWidth label="Tên sản phẩm" name="name" value={formData.name} onChange={handleChange} />
            </Grid>
            <Grid item xs={4}>
              <TextField fullWidth label="Giá" name="price" type="number" value={formData.price} onChange={handleChange} />
            </Grid>
            <Grid item xs={8}>
              <Box sx={{ display: "flex", gap: 1 }}>
                <FormControl fullWidth>
                  <InputLabel>Danh mục</InputLabel>
                  <Select name="category_id" value={formData.category_id} label="Danh mục" onChange={handleChange}>
                    {categories.map((cat) => (
                      <MenuItem key={cat.id} value={cat.id}>
                        {cat.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <Tooltip title="Thêm danh mục mới">
                  <Button variant="outlined" onClick={handleOpenCatDialog} sx={{ minWidth: "50px", height: "56px" }}>
                    <AddBoxIcon />
                  </Button>
                </Tooltip>
              </Box>
            </Grid>
            <Grid item xs={4}>
              <TextField fullWidth label="Tồn kho" name="stock_quantity" type="number" value={formData.stock_quantity} onChange={handleChange} />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth label="Link ảnh" name="image_url" value={formData.image_url} onChange={handleChange} />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth multiline rows={2} label="Mô tả ngắn" name="description" value={formData.description} onChange={handleChange} />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={5}
                label="Mô tả chi tiết"
                name="detailed_description"
                value={formData.detailed_description}
                onChange={handleChange}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} color="inherit">
            Hủy
          </Button>
          <Button onClick={handleSubmit} variant="contained">
            {isEditing ? "Cập Nhật" : "Thêm Mới"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* --- DIALOG TẠO DANH MỤC --- */}
      <Dialog open={openCatDialog} onClose={() => setOpenCatDialog(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Tạo Danh Mục Mới</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Tên danh mục"
            fullWidth
            variant="outlined"
            value={newCategoryName}
            onChange={(e) => setNewCategoryName(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenCatDialog(false)} color="inherit">
            Hủy
          </Button>
          <Button onClick={handleSubmitCategory} variant="contained">
            Tạo
          </Button>
        </DialogActions>
      </Dialog>

      {/* --- DIALOG XÁC NHẬN XÓA (MỚI) --- */}
      <Dialog open={openDeleteDialog} onClose={() => setOpenDeleteDialog(false)}>
        <DialogTitle
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1,
            color: "#d32f2f",
          }}
        >
          <WarningIcon /> Xác nhận xóa
        </DialogTitle>
        <DialogContent>
          <DialogContentText>Bạn có chắc chắn muốn xóa sản phẩm này? Hành động này không thể hoàn tác.</DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDeleteDialog(false)} color="inherit">
            Hủy
          </Button>
          <Button onClick={handleDelete} variant="contained" color="error" autoFocus>
            Xóa Ngay
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}

export default AdminPage;
