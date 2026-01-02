import React, { useState, useEffect } from "react";
import { Routes, Route, Link, useNavigate } from "react-router-dom";
import axios from "axios";

// --- 1. IMPORT CÁC COMPONENT CỦA MUI ---
import { AppBar, Toolbar, Typography, Button, Container, Box, IconButton, TextField, Autocomplete } from "@mui/material";

// --- 2. IMPORT CÁC ICON ---
import HomeIcon from "@mui/icons-material/Home";
import LoginIcon from "@mui/icons-material/Login";
import AppRegistrationIcon from "@mui/icons-material/AppRegistration";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import LogoutIcon from "@mui/icons-material/Logout";
import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettings";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong"; // Icon Đơn mua
import DashboardIcon from "@mui/icons-material/Dashboard"; // <-- Icon Thống kê MỚI

// --- 3. IMPORT CÁC TRANG (PAGES) ---
import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import ProfilePage from "./pages/ProfilePage";
import CartPage from "./pages/CartPage";
import ProductDetailPage from "./pages/ProductDetailPage";
import SellerPage from "./pages/SellerPage";
import AdminPage from "./pages/AdminPage"; // Trang quản lý sản phẩm
import AdminOrdersPage from "./pages/AdminOrdersPage"; // Trang quản lý đơn hàng
import OrderHistoryPage from "./pages/OrderHistoryPage"; // Trang lịch sử mua hàng
import DashboardPage from "./pages/DashboardPage"; // <-- TRANG THỐNG KÊ MỚI
import CheckoutPage from "./pages/CheckoutPage"; // Trang thanh toán

import ProtectedRoute from "./components/ProtectedRoute";
import ContactButton from "./components/ContactButton";
import ScrollToTopButton from "./components/ScrollToTopButton";

// Import Toast
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const MuiLink = React.forwardRef((props, ref) => <Link ref={ref} {...props} />);

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userRole, setUserRole] = useState(null);
  const navigate = useNavigate();
  const [options, setOptions] = useState([]);
  const [loading, setLoading] = useState(false);

  // Hàm kiểm tra đăng nhập
  const checkLoginStatus = () => {
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("role");
    setIsLoggedIn(!!token);
    setUserRole(role);
  };

  useEffect(() => {
    checkLoginStatus();
    window.addEventListener("auth-change", checkLoginStatus);
    return () => {
      window.removeEventListener("auth-change", checkLoginStatus);
    };
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    window.dispatchEvent(new Event("auth-change"));
    navigate("/login");
  };

  const handleSearchInputChange = async (event, value) => {
    if (!value || value.length < 1) {
      setOptions([]);
      return;
    }
    setLoading(true);
    try {
      const response = await axios.get(`https://ecommerce-project-i12t.onrender.com/api/products/search?q=${value}`);
      setOptions(response.data);
    } catch (error) {
      console.error("Lỗi tìm kiếm:", error);
      setOptions([]);
    }
    setLoading(false);
  };

  return (
    <Container maxWidth="lg" style={{ paddingTop: "20px" }}>
      <ToastContainer position="top-right" autoClose={3000} theme="colored" />

      <AppBar position="static" style={{ marginBottom: "20px" }}>
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            <Button color="inherit" component={MuiLink} to="/" startIcon={<HomeIcon />}>
              My E-Commerce
            </Button>
          </Typography>

          <Autocomplete
            freeSolo
            sx={{ width: 300, marginRight: 2 }}
            options={options}
            loading={loading}
            getOptionLabel={(option) => {
              if (typeof option === "string") return option;
              if (option && option.name) return option.name;
              return "";
            }}
            onInputChange={handleSearchInputChange}
            onChange={(event, value) => {
              let searchTerm = "";
              if (typeof value === "string") searchTerm = value;
              else if (value && value.name) searchTerm = value.name;
              if (searchTerm) {
                navigate(`/?q=${encodeURIComponent(searchTerm)}`);
                window.location.reload();
              }
            }}
            renderInput={(params) => <TextField {...params} label="Tìm kiếm..." size="small" sx={{ bgcolor: "white", borderRadius: 1 }} />}
          />

          {isLoggedIn ? (
            <>
              {/* --- NHÓM QUẢN LÝ (Admin/Sales) --- */}

              {/* 1. Nút Thống Kê (Chỉ Admin thấy) */}
              {(userRole === "admin" || userRole === "sales") && (
                <Button color="inherit" component={MuiLink} to="/admin/dashboard" startIcon={<DashboardIcon />}>
                  Thống Kê
                </Button>
              )}

              {/* 2. Nút Quản Lý Sản Phẩm (Admin & Sales) */}
              {(userRole === "admin" || userRole === "sales") && (
                <Button color="inherit" component={MuiLink} to="/admin" startIcon={<AdminPanelSettingsIcon />}>
                  Quản Lý
                </Button>
              )}

              {/* --- NHÓM KHÁCH HÀNG --- */}
              <Button color="inherit" component={MuiLink} to="/orders" startIcon={<ReceiptLongIcon />}>
                Đơn Mua
              </Button>

              <IconButton color="inherit" component={MuiLink} to="/profile">
                <AccountCircleIcon />
              </IconButton>
              <IconButton color="inherit" component={MuiLink} to="/cart">
                <ShoppingCartIcon />
              </IconButton>
              <Button color="inherit" onClick={handleLogout} startIcon={<LogoutIcon />}>
                Đăng Xuất
              </Button>
            </>
          ) : (
            <>
              <Button color="inherit" component={MuiLink} to="/login" startIcon={<LoginIcon />}>
                Đăng Nhập
              </Button>
              <Button color="inherit" component={MuiLink} to="/register" startIcon={<AppRegistrationIcon />}>
                Đăng Ký
              </Button>
            </>
          )}
        </Toolbar>
      </AppBar>

      {/* --- DANH SÁCH CÁC ROUTES (ĐƯỜNG DẪN) --- */}
      <Routes>
        {/* Công khai */}
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/product/:id" element={<ProductDetailPage />} />
        <Route path="/seller/:id" element={<SellerPage />} />

        {/* Cần đăng nhập */}
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              {" "}
              <ProfilePage />{" "}
            </ProtectedRoute>
          }
        />
        <Route
          path="/cart"
          element={
            <ProtectedRoute>
              {" "}
              <CartPage />{" "}
            </ProtectedRoute>
          }
        />
        <Route
          path="/checkout"
          element={
            <ProtectedRoute>
              {" "}
              <CheckoutPage />{" "}
            </ProtectedRoute>
          }
        />
        <Route
          path="/orders"
          element={
            <ProtectedRoute>
              {" "}
              <OrderHistoryPage />{" "}
            </ProtectedRoute>
          }
        />

        {/* Cần quyền Admin/Sales */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute>
              {" "}
              <AdminPage />{" "}
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/orders"
          element={
            <ProtectedRoute>
              {" "}
              <AdminOrdersPage />{" "}
            </ProtectedRoute>
          }
        />

        {/* --- ROUTE THỐNG KÊ MỚI --- */}
        <Route
          path="/admin/dashboard"
          element={
            <ProtectedRoute>
              {" "}
              <DashboardPage />{" "}
            </ProtectedRoute>
          }
        />
      </Routes>

      {/* Các nút nổi */}
      <ContactButton />
      <ScrollToTopButton />
    </Container>
  );
}

export default App;
