// Hàm này nhận vào danh sách các role ĐƯỢC PHÉP (ví dụ: ['admin', 'sales'])
const authorizeRole = (allowedRoles) => {
  return (req, res, next) => {
    // req.userRole đã được lấy từ authMiddleware trước đó
    if (!req.userRole || !allowedRoles.includes(req.userRole)) {
      return res
        .status(403)
        .json({ error: "Bạn không có quyền thực hiện hành động này!" });
    }
    next(); // Có quyền thì cho đi tiếp
  };
};

module.exports = authorizeRole;
