import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import {
  Container,
  Box,
  Typography,
  TextField,
  Button,
  Grid,
  Stack, // <-- Import Stack
} from "@mui/material";
import AppRegistrationIcon from "@mui/icons-material/AppRegistration";
import { toast } from "react-toastify";

function RegisterPage() {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    phone_number: "",
    full_name: "",
  });
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post("https://ecommerce-project-i12t.onrender.com/api/users/register", formData);
      toast.success("Đăng ký thành công! Vui lòng đăng nhập.");
      navigate("/login");
    } catch (error) {
      toast.error(error.response?.data?.error || "Lỗi đăng ký");
    }
  };

  return (
    <Container component="main" maxWidth="xs">
      <Box
        sx={{
          marginTop: 8,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <Typography component="h1" variant="h5">
          Đăng Ký Tài Khoản
        </Typography>

        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 3, width: "100%" }}>
          {/* --- DÙNG STACK ĐỂ CĂN THẲNG HÀNG --- */}
          <Stack spacing={2}>
            <TextField
              required
              fullWidth
              id="full_name"
              label="Họ và tên"
              name="full_name"
              autoComplete="name"
              value={formData.full_name}
              onChange={handleChange}
            />
            <TextField
              required
              fullWidth
              id="email"
              label="Địa chỉ Email"
              name="email"
              autoComplete="email"
              value={formData.email}
              onChange={handleChange}
            />
            <TextField
              required
              fullWidth
              id="phone_number"
              label="Số điện thoại"
              name="phone_number"
              autoComplete="tel"
              value={formData.phone_number}
              onChange={handleChange}
            />
            <TextField
              required
              fullWidth
              name="password"
              label="Mật khẩu"
              type="password"
              id="password"
              value={formData.password}
              onChange={handleChange}
            />

            <Button type="submit" fullWidth variant="contained" startIcon={<AppRegistrationIcon />}>
              Đăng Ký
            </Button>

            <Grid container justifyContent="flex-end">
              <Grid item>
                <Button color="primary" onClick={() => navigate("/login")} sx={{ textTransform: "none" }}>
                  Đã có tài khoản? Đăng nhập ngay
                </Button>
              </Grid>
            </Grid>
          </Stack>
          {/* ------------------------------------- */}
        </Box>
      </Box>
    </Container>
  );
}

export default RegisterPage;
