import React from 'react';
import { Navigate } from 'react-router-dom';

// Component này nhận 1 "prop" là "children"
// "children" chính là trang mà nó bọc (ví dụ: <ProfilePage />)
function ProtectedRoute({ children }) {
  // Lấy token từ localStorage
  const token = localStorage.getItem('token');

  if (token) {
    // Nếu có token (đã đăng nhập), cho phép "trẻ em" (children) được hiển thị
    return children;
  } else {
    // Nếu không có token, "chuyển hướng" người dùng về trang /login
    return <Navigate to="/login" replace />;
  }
}

export default ProtectedRoute;