const jwt = require("jsonwebtoken");

function authenticateToken(req, res, next) {
  // Lấy token từ header "Authorization"
  // Định dạng sẽ là: "Bearer [token_dài_loằng_ngoằng]"
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1]; // Tách lấy phần token

  // Nếu không có token, từ chối
  if (token == null) {
    return res.sendStatus(401); // Unauthorized (Chưa xác thực)
  }

  // Xác thực token
  jwt.verify(token, process.env.JWT_SECRET, (err, userPayload) => {
    // Nếu token sai (hết hạn, hoặc sai chữ ký)
    if (err) {
      return res.sendStatus(403); // Forbidden (Bị cấm)
    }

    // Nếu token hợp lệ, lưu thông tin user (userId) vào request
    // để các API đằng sau có thể dùng
    req.userId = userPayload.userId;
    req.userRole = userPayload.role;

    // Cho phép đi tiếp
    next();
  });
}

module.exports = authenticateToken;
