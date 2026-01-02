import React, { useState, useEffect } from "react";
import axios from "axios";
import { Container, Grid, Paper, Typography, Box, Table, TableBody, TableCell, TableHead, TableRow } from "@mui/material";
import AttachMoneyIcon from "@mui/icons-material/AttachMoney";
import ShoppingBagIcon from "@mui/icons-material/ShoppingBag";
import PeopleIcon from "@mui/icons-material/People";
import InventoryIcon from "@mui/icons-material/Inventory";
import { toast } from "react-toastify";

// Import thư viện biểu đồ
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

function DashboardPage() {
  const [stats, setStats] = useState(null);
  const userRole = localStorage.getItem("role"); // Lấy role để đổi tiêu đề

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get("https://ecommerce-project-i12t.onrender.com/api/admin/stats", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setStats(res.data);
      } catch (error) {
        console.error(error);
        toast.error("Không thể tải thống kê");
      }
    };
    fetchStats();
  }, []);

  if (!stats) return <Container sx={{ mt: 4 }}>Đang tải thống kê...</Container>;

  const StatCard = ({ title, value, icon, color }) => (
    <Paper
      elevation={3}
      sx={{
        p: 3,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        height: "100%",
      }}
    >
      <Box>
        <Typography variant="subtitle1" color="text.secondary">
          {title}
        </Typography>
        <Typography variant="h4" fontWeight="bold">
          {value}
        </Typography>
      </Box>
      <Box
        sx={{
          bgcolor: color,
          p: 1.5,
          borderRadius: "50%",
          color: "white",
          display: "flex",
        }}
      >
        {icon}
      </Box>
    </Paper>
  );

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" fontWeight="bold" gutterBottom sx={{ mb: 4 }}>
        {userRole === "admin" ? "Thống Kê Toàn Hệ Thống" : "Thống Kê Gian Hàng Của Bạn"}
      </Typography>

      {/* 1. CÁC THẺ SỐ LIỆU */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard title="Doanh Thu" value={`${Number(stats.revenue).toLocaleString()} đ`} icon={<AttachMoneyIcon />} color="#2e7d32" />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard title="Đơn Hàng" value={stats.orders} icon={<ShoppingBagIcon />} color="#1976d2" />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard title="Sản Phẩm" value={stats.products} icon={<InventoryIcon />} color="#ed6c02" />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard title="Khách Mua" value={stats.customers} icon={<PeopleIcon />} color="#9c27b0" />
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {/* 2. BIỂU ĐỒ DOANH THU (Mới) */}
        <Grid item xs={12} md={8}>
          <Paper elevation={3} sx={{ p: 3, height: "400px" }}>
            <Typography variant="h6" fontWeight="bold" gutterBottom>
              Biểu đồ doanh thu (Giả lập tuần này)
            </Typography>
            <ResponsiveContainer width="100%" height="90%">
              <BarChart data={stats.chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip
                  formatter={(value) =>
                    new Intl.NumberFormat("vi-VN", {
                      style: "currency",
                      currency: "VND",
                    }).format(value)
                  }
                />
                <Legend />
                <Bar dataKey="doanhThu" name="Doanh Thu" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        {/* 3. ĐƠN HÀNG GẦN ĐÂY */}
        <Grid item xs={12} md={4}>
          <Paper elevation={3} sx={{ p: 3, height: "400px", overflowY: "auto" }}>
            <Typography variant="h6" fontWeight="bold" gutterBottom>
              Đơn mới nhất
            </Typography>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Khách</TableCell>
                  <TableCell align="right">Tổng (Đơn)</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {stats.recentOrders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell>
                      <Typography variant="body2" fontWeight="bold">
                        {order.user.full_name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        #{order.id}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">{Number(order.total_price).toLocaleString()} đ</TableCell>
                  </TableRow>
                ))}
                {stats.recentOrders.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={2} align="center">
                      Chưa có đơn hàng
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
}

export default DashboardPage;
