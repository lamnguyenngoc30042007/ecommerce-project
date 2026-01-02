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
  Stack, // <-- 1. Import Stack
} from "@mui/material";
import LoginIcon from "@mui/icons-material/Login";
import { toast } from "react-toastify";

function LoginPage() {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(
        "http://localhost:3000/api/users/login",
        formData
      );
      localStorage.setItem("token", response.data.token);
      localStorage.setItem("role", response.data.role);
      toast.success("Đăng nhập thành công!");
      window.dispatchEvent(new Event("auth-change"));
      navigate("/");
    } catch (error) {
      console.error("Lỗi:", error);
      toast.error(error.response?.data?.error || "Lỗi đăng nhập");
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
          Đăng Nhập
        </Typography>

        <Box
          component="form"
          onSubmit={handleSubmit}
          sx={{ mt: 3, width: "100%" }}
        >
          {" "}
          {/* Thêm width 100% */}
          {/* --- 2. DÙNG STACK THAY CHO GRID --- */}
          <Stack spacing={2}>
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
              name="password"
              label="Mật khẩu"
              type="password"
              id="password"
              autoComplete="current-password"
              value={formData.password}
              onChange={handleChange}
            />

            <Button
              type="submit"
              fullWidth
              variant="contained"
              startIcon={<LoginIcon />}
              sx={{ mt: 1 }} // Giảm margin top vì Stack đã lo khoảng cách
            >
              Đăng Nhập
            </Button>

            <Grid container justifyContent="flex-end">
              <Grid item>
                <Button
                  color="primary"
                  onClick={() => navigate("/register")}
                  sx={{ textTransform: "none" }}
                >
                  Chưa có tài khoản? Đăng ký ngay
                </Button>
              </Grid>
            </Grid>
          </Stack>
          {/* ---------------------------------- */}
        </Box>
      </Box>
    </Container>
  );
}

export default LoginPage;
