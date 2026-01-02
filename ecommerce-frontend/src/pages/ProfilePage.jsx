import React, { useState, useEffect } from "react";
import axios from "axios";
import { Container, Typography, TextField, Button, Paper, Box, Avatar, IconButton, Badge, Stack } from "@mui/material";
import SaveIcon from "@mui/icons-material/Save";
import EditIcon from "@mui/icons-material/Edit";
import CancelIcon from "@mui/icons-material/Cancel";
import PhotoCamera from "@mui/icons-material/PhotoCamera";
import { toast } from "react-toastify";

function ProfilePage() {
  const [formData, setFormData] = useState({
    email: "",
    full_name: "",
    phone_number: "",
    address: "",
    avatar_url: "",
  });

  const [originalData, setOriginalData] = useState({});
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // Đã xóa state 'message' vì không dùng nữa

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      const response = await axios.get("https://ecommerce-project-i12t.onrender.com/api/users/profile", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = {
        email: response.data.email || "",
        full_name: response.data.full_name || "",
        phone_number: response.data.phone_number || "",
        address: response.data.address || "",
        avatar_url: response.data.avatar_url || "",
      };
      setFormData(data);
      setOriginalData(data);
    } catch (error) {
      console.error("Lỗi tải profile:", error);
      toast.error("Không thể tải thông tin hồ sơ.");
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast.warning("Ảnh quá lớn! Vui lòng chọn ảnh dưới 2MB.");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, avatar_url: reader.result });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleEditClick = (e) => {
    e.preventDefault();
    setIsEditing(true);
  };

  const handleCancelClick = (e) => {
    e.preventDefault();
    setFormData(originalData); // Khôi phục dữ liệu cũ
    setIsEditing(false);
    toast.info("Đã hủy chỉnh sửa.");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const token = localStorage.getItem("token");
    try {
      await axios.put(
        "https://ecommerce-project-i12t.onrender.com/api/users/profile",
        { ...formData },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setOriginalData(formData); // Cập nhật bản gốc mới
      setIsEditing(false);
      toast.success("Cập nhật hồ sơ thành công!");
    } catch (error) {
      toast.error("Có lỗi xảy ra hoặc ảnh quá lớn (giới hạn 10MB).");
    }
    setLoading(false);
  };

  return (
    <Container maxWidth="sm" sx={{ mt: 8, mb: 8 }}>
      <Paper
        elevation={6}
        sx={{
          p: 5,
          borderRadius: 4,
          background: "linear-gradient(to bottom right, #ffffff, #f8f9fa)",
        }}
      >
        <form onSubmit={handleSubmit}>
          <Stack spacing={3} alignItems="center">
            {/* AVATAR */}
            <Box sx={{ position: "relative" }}>
              <Badge
                overlap="circular"
                anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
                badgeContent={
                  isEditing ? (
                    <IconButton
                      color="primary"
                      component="label"
                      sx={{
                        bgcolor: "white",
                        boxShadow: 2,
                        "&:hover": { bgcolor: "#f0f0f0" },
                      }}
                    >
                      <input hidden accept="image/*" type="file" onChange={handleImageUpload} />
                      <PhotoCamera />
                    </IconButton>
                  ) : null
                }
              >
                <Avatar
                  alt={formData.full_name}
                  src={formData.avatar_url}
                  sx={{
                    width: 120,
                    height: 120,
                    border: "4px solid white",
                    boxShadow: 3,
                    fontSize: "3rem",
                  }}
                >
                  {!formData.avatar_url && formData.full_name ? formData.full_name.charAt(0) : "U"}
                </Avatar>
              </Badge>
            </Box>

            {/* NAME & EMAIL */}
            <Box textAlign="center">
              <Typography variant="h4" fontWeight="bold" color="text.primary">
                {formData.full_name || "Người dùng mới"}
              </Typography>
              <Typography variant="body1" color="text.secondary">
                {formData.email}
              </Typography>
            </Box>

            {/* INPUT FIELDS */}
            <Stack spacing={2} sx={{ width: "100%" }}>
              <TextField
                label="Họ và tên"
                name="full_name"
                value={formData.full_name}
                onChange={handleChange}
                fullWidth
                variant={isEditing ? "outlined" : "standard"}
                InputProps={{
                  readOnly: !isEditing,
                  disableUnderline: !isEditing,
                  style: {
                    color: "black",
                    fontWeight: isEditing ? "normal" : "500",
                  },
                }}
              />

              <TextField
                label="Số điện thoại"
                name="phone_number"
                value={formData.phone_number}
                onChange={handleChange}
                fullWidth
                variant={isEditing ? "outlined" : "standard"}
                InputProps={{
                  readOnly: !isEditing,
                  disableUnderline: !isEditing,
                  style: {
                    color: "black",
                    fontWeight: isEditing ? "normal" : "500",
                  },
                }}
              />

              <TextField
                label="Địa chỉ giao hàng"
                name="address"
                value={formData.address}
                onChange={handleChange}
                fullWidth
                multiline
                rows={isEditing ? 3 : 2}
                variant={isEditing ? "outlined" : "standard"}
                InputProps={{
                  readOnly: !isEditing,
                  disableUnderline: !isEditing,
                  style: {
                    color: "black",
                    fontWeight: isEditing ? "normal" : "500",
                  },
                }}
              />
            </Stack>

            {/* BUTTONS */}
            <Box
              sx={{
                width: "100%",
                display: "flex",
                justifyContent: "center",
                gap: 2,
                mt: 2,
              }}
            >
              {!isEditing ? (
                <Button
                  type="button" // ✅ Chuẩn
                  variant="contained"
                  size="large"
                  startIcon={<EditIcon />}
                  onClick={handleEditClick}
                  sx={{ px: 4, borderRadius: 2 }}
                >
                  Chỉnh sửa hồ sơ
                </Button>
              ) : (
                <>
                  <Button
                    type="submit" // ✅ Chuẩn
                    variant="contained"
                    size="large"
                    startIcon={<SaveIcon />}
                    disabled={loading}
                    sx={{ px: 4, borderRadius: 2 }}
                  >
                    {loading ? "Đang lưu..." : "Lưu"}
                  </Button>
                  <Button
                    type="button" // ✅ Chuẩn
                    variant="outlined"
                    color="error"
                    size="large"
                    startIcon={<CancelIcon />}
                    onClick={handleCancelClick}
                    sx={{ px: 4, borderRadius: 2 }}
                  >
                    Hủy
                  </Button>
                </>
              )}
            </Box>
          </Stack>
        </form>
      </Paper>
    </Container>
  );
}

export default ProfilePage;
