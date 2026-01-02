// 1. Import thư viện Express
const express = require("express");

// Import cors
const cors = require("cors");

// Import PrismaClient
const { PrismaClient } = require("@prisma/client");

const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const authenticateToken = require("./authMiddleware");

const authorizeRole = require("./authorizeRole");

// 2. Khởi tạo ứng dụng Express
const app = express();

// Sử dụng cors (cho phép tất cả các nguồn gọi API)
app.use(
  cors({
    origin: [
      "http://localhost:5173", // Cho phép localhost (để cậu test ở nhà)
      "https://ecommerce-project-sage-beta.vercel.app", // <--- THÊM DÒNG NÀY (Link Vercel của cậu)
    ],
    credentials: true,
  })
);

// Tăng giới hạn lên 10MB để gửi được ảnh
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ limit: "10mb", extended: true }));

// Khởi tạo 1 thực thể (instance) của PrismaClient
const prisma = new PrismaClient();

// 3. Chọn một cổng (port) để chạy server
const port = 3000;

// 4. TẠO API LẤY TẤT CẢ SẢN PHẨM
// API Lấy sản phẩm (Hỗ trợ: Search, Category, Price Filter, Sorting)
app.get("/api/products", async (req, res) => {
  const { categoryId, minPrice, maxPrice, sort, sellerId } = req.query;

  // 1. Xây dựng điều kiện lọc (where)
  const whereClause = {
    isDeleted: false, // <--- LUÔN LUÔN THÊM ĐIỀU KIỆN NÀY
  };

  if (sellerId) {
    whereClause.createdById = parseInt(sellerId);
  }

  // Lọc theo danh mục
  if (categoryId) {
    whereClause.category_id = parseInt(categoryId);
  }

  // Lọc theo giá (gte = lớn hơn hoặc bằng, lte = nhỏ hơn hoặc bằng)
  if (minPrice || maxPrice) {
    whereClause.price = {};
    if (minPrice) whereClause.price.gte = parseFloat(minPrice);
    if (maxPrice) whereClause.price.lte = parseFloat(maxPrice);
  }

  // 2. Xây dựng điều kiện sắp xếp (orderBy)
  let orderBy = { created_at: "desc" }; // Mặc định là Mới nhất

  if (sort === "price_asc") {
    orderBy = { price: "asc" }; // Giá tăng dần
  } else if (sort === "price_desc") {
    orderBy = { price: "desc" }; // Giá giảm dần
  }

  try {
    const products = await prisma.product.findMany({
      where: whereClause,
      orderBy: orderBy,
    });
    res.json(products);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Lỗi lấy sản phẩm" });
  }
});

// --- CÁC API DÀNH CHO ADMIN VÀ SALES ---

// 12. THÊM SẢN PHẨM (Admin & Sales được phép)
app.post("/api/products", authenticateToken, authorizeRole(["admin", "sales"]), async (req, res) => {
  try {
    const { name, description, detailed_description, price, stock_quantity, image_url, category_id } = req.body;

    const newProduct = await prisma.product.create({
      data: {
        name,
        description,
        detailed_description,
        price,
        stock_quantity: parseInt(stock_quantity),
        image_url,
        category_id: parseInt(category_id),
        createdById: req.userId, // Lưu ID của người đang đăng nhập (Sales/Admin)
      },
    });
    res.status(201).json(newProduct);
  } catch (error) {
    res.status(500).json({ error: "Lỗi thêm sản phẩm" });
  }
});

// 13. SỬA SẢN PHẨM (Admin & Sales được phép)
// API 5: Sửa sản phẩm (Chỉ Admin/Sales)
app.put("/api/products/:id", authenticateToken, authorizeRole(["admin", "sales"]), async (req, res) => {
  try {
    const { id } = req.params;

    // Lấy dữ liệu từ body
    const { name, price, stock_quantity, description, detailed_description, image_url, category_id } = req.body;

    const updatedProduct = await prisma.product.update({
      where: { id: parseInt(id) },
      data: {
        name,
        description,
        detailed_description,
        image_url,
        // --- QUAN TRỌNG: PHẢI CHUYỂN ĐỔI SANG SỐ ---
        price: parseFloat(price), // Chuyển giá thành số thực
        stock_quantity: parseInt(stock_quantity), // Chuyển kho thành số nguyên
        category_id: parseInt(category_id), // Chuyển danh mục thành số nguyên
        isDeleted: false, // <--- Gỡ bỏ nhãn "Đã xóa"
        // ------------------------------------------
      },
    });
    res.json(updatedProduct);
  } catch (error) {
    console.error("Lỗi sửa sản phẩm:", error); // Log lỗi ra terminal để dễ xem
    res.status(500).json({ error: "Lỗi sửa sản phẩm" });
  }
});

// 14. XÓA SẢN PHẨM (SOFT DELETE - Có kiểm tra quyền sở hữu)
app.delete("/api/products/:id", authenticateToken, authorizeRole(["admin", "sales"]), async (req, res) => {
  try {
    const productId = parseInt(req.params.id); // <-- Biến tên là productId
    const userId = req.userId;
    const userRole = req.userRole;

    // 1. Tìm sản phẩm trước
    const product = await prisma.product.findUnique({
      where: { id: productId }, // <-- Dùng productId ở đây (Đúng)
    });

    if (!product) return res.status(404).json({ error: "Không tìm thấy sản phẩm" });

    // 2. KIỂM TRA QUYỀN SỞ HỮU
    // Nếu là Sales VÀ không phải là người tạo ra sản phẩm này -> Chặn
    if (userRole === "sales" && product.createdById !== userId) {
      return res.status(403).json({
        error: "Bạn chỉ có thể xóa sản phẩm do chính mình đăng bán!",
      });
    }

    // 3. Nếu là Admin hoặc là Chủ sở hữu -> Thực hiện Xóa mềm
    await prisma.product.update({
      where: { id: productId }, // <--- SỬA LẠI Ở ĐÂY: Dùng productId
      data: {
        isDeleted: true, // Đánh dấu đã xóa
        stock_quantity: 0, // Set kho về 0
      },
    });

    res.json({ message: "Đã xóa sản phẩm thành công" });
  } catch (error) {
    console.error("CHI TIẾT LỖI XÓA:", error);
    res.status(500).json({ error: "Lỗi khi xóa sản phẩm: " + error.message });
  }
});

// --- API LẤY DANH SÁCH SẢN PHẨM CHO TRANG QUẢN LÝ (CÓ PHÂN QUYỀN) ---
app.get("/api/admin/products", authenticateToken, authorizeRole(["admin", "sales"]), async (req, res) => {
  try {
    const { userId, userRole } = req; // Lấy thông tin từ Token (do authMiddleware giải mã)

    let whereClause = {};

    // LOGIC QUAN TRỌNG NHẤT Ở ĐÂY:
    // Nếu là Sales: Chỉ tìm sản phẩm có createdById bằng ID của họ
    if (userRole === "sales") {
      whereClause = { createdById: userId };
    }
    // Nếu là Admin: whereClause vẫn là rỗng {} -> Nghĩa là lấy tất cả

    const products = await prisma.product.findMany({
      where: whereClause,
      orderBy: { created_at: "desc" },
      include: {
        createdBy: {
          // Lấy thêm tên người tạo để hiển thị cho Admin xem
          select: { full_name: true, email: true },
        },
      },
    });

    res.json(products);
  } catch (error) {
    res.status(500).json({ error: "Lỗi lấy danh sách sản phẩm quản lý" });
  }
});

// 4b. TẠO API TÌM KIẾM SẢN PHẨM (SEARCH)
app.get("/api/products/search", async (req, res) => {
  // Lấy từ khóa "q" từ query string (ví dụ: ?q=ao)
  const { q } = req.query;

  // Nếu không có từ khóa, trả về mảng rỗng
  if (!q) {
    return res.json([]);
  }

  try {
    // Dùng Prisma để tìm sản phẩm
    const products = await prisma.product.findMany({
      where: {
        isDeleted: false, // <--- CHỈ TÌM SẢN PHẨM CHƯA XÓA
        name: {
          contains: q,
          mode: "insensitive",
        },
      },
      take: 10, // Giới hạn 10 kết quả cho nhanh
    });

    res.json(products); // Trả về danh sách tìm được
  } catch (error) {
    console.error("Lỗi khi tìm kiếm:", error);
    res.status(500).json({ error: "Lỗi khi tìm kiếm sản phẩm" });
  }
});

// 4c. TẠO API LẤY CHI TIẾT 1 SẢN PHẨM
// :id là một "parameter" (tham số) động
app.get("/api/products/:id", async (req, res) => {
  try {
    // 1. Lấy ID từ URL (ví dụ /api/products/5)
    // req.params.id sẽ là "5" (kiểu string)
    const productId = parseInt(req.params.id);

    // 2. Tìm sản phẩm duy nhất trong CSDL
    const product = await prisma.product.findUnique({
      where: {
        id: productId,
      },
      include: {
        createdBy: {
          select: { full_name: true, email: true }, // Chỉ lấy tên và email
        },
      },
    });

    // 3. Xử lý nếu không tìm thấy
    if (!product) {
      return res.status(404).json({ error: "Không tìm thấy sản phẩm" });
    }

    // 4. Trả về sản phẩm (dưới dạng JSON)
    res.json(product);
  } catch (error) {
    console.error("Lỗi khi lấy chi tiết sản phẩm:", error);
    res.status(500).json({ error: "Đã xảy ra lỗi" });
  }
});

// 6. TẠO API ĐĂNG KÝ (REGISTER)
app.post("/api/users/register", async (req, res) => {
  try {
    // Lấy thông tin từ "body" của request
    const { email, password, phone_number, full_name } = req.body;

    // Kiểm tra xem email hoặc SĐT đã tồn tại chưa
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ email: email }, { phone_number: phone_number }],
      },
    });

    if (existingUser) {
      // Nếu đã tồn tại, trả về lỗi 400
      return res.status(400).json({ error: "Email hoặc SĐT đã tồn tại" });
    }

    // Mã hóa mật khẩu (hash)
    // "10" là số "lượt" mã hóa, càng cao càng an toàn nhưng càng chậm
    const hashedPassword = await bcrypt.hash(password, 10);

    // Tạo người dùng mới trong CSDL
    const newUser = await prisma.user.create({
      data: {
        email: email,
        password_hash: hashedPassword, // Lưu mật khẩu đã mã hóa
        phone_number: phone_number,
        full_name: full_name,
      },
    });

    // Trả về thành công (status 201 - Created)
    res.status(201).json({ message: "Tạo tài khoản thành công", userId: newUser.id });
  } catch (error) {
    console.error("Lỗi khi đăng ký:", error);
    res.status(500).json({ error: "Đã xảy ra lỗi khi đăng ký" });
  }
});

// 7. TẠO API ĐĂNG NHẬP (LOGIN)
app.post("/api/users/login", async (req, res) => {
  try {
    // Lấy email và password từ body
    const { email, password } = req.body;

    // Tìm người dùng trong CSDL bằng email
    const user = await prisma.user.findUnique({
      where: { email: email },
    });

    // Nếu không tìm thấy user, trả về lỗi
    if (!user) {
      return res.status(400).json({ error: "Email hoặc mật khẩu không đúng" });
    }

    // So sánh mật khẩu người dùng gõ vào với mật khẩu đã mã hóa trong CSDL
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);

    // Nếu mật khẩu sai, trả về lỗi
    if (!isPasswordValid) {
      return res.status(400).json({ error: "Email hoặc mật khẩu không đúng" });
    }

    // Nếu đúng, tạo ra một "vé" (JWT Token)
    // "Vé" này chứa thông tin user (userId) và có hạn 1 giờ
    const token = jwt.sign(
      {
        userId: user.id,
        role: user.role, // <--- THÊM DÒNG NÀY (Ghi chức vụ vào vé)
      }, // Thông tin bạn muốn lưu trong token
      process.env.JWT_SECRET, // Chìa khóa bí mật (lấy từ file .env)
      { expiresIn: "1h" } // Hạn sử dụng: 1 giờ
    );

    // Trả về "vé" (token) cho frontend
    res.json({
      message: "Đăng nhập thành công",
      token: token,
      role: user.role,
    });
  } catch (error) {
    console.error("Lỗi khi đăng nhập:", error);
    res.status(500).json({ error: "Đã xảy ra lỗi khi đăng nhập" });
  }
});

// --- 1. API LẤY THÔNG TIN CÁ NHÂN (GET) ---
app.get("/api/users/profile", authenticateToken, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId }, // Lấy user theo ID từ token
      // Chỉ chọn các trường cần thiết, KHÔNG trả về password!
      select: {
        id: true,
        email: true,
        full_name: true,
        phone_number: true,
        address: true,
        avatar_url: true, // <--- Thêm dòng này để lấy ảnh về
      },
    });
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: "Lỗi khi lấy thông tin người dùng" });
  }
});

// --- 2. API CẬP NHẬT THÔNG TIN (PUT) ---
app.put("/api/users/profile", authenticateToken, async (req, res) => {
  try {
    // Lấy dữ liệu người dùng gửi lên
    const { full_name, phone_number, address, avatar_url } = req.body;

    // Cập nhật vào CSDL
    const updatedUser = await prisma.user.update({
      where: { id: req.userId },
      data: {
        full_name: full_name,
        phone_number: phone_number,
        address: address,
        avatar_url, // <--- Lưu ảnh vào CSDL
      },
    });

    res.json({ message: "Cập nhật thành công!", user: updatedUser });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Lỗi khi cập nhật thông tin" });
  }
});

// API Lấy thông tin công khai của người bán (Public Profile)
app.get("/api/users/public/:id", async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        full_name: true,
        email: true,
        phone_number: true,
        avatar_url: true,
        created_at: true,
        // KHÔNG lấy password, address (thông tin nhạy cảm)
      },
    });

    if (!user) return res.status(404).json({ error: "Người dùng không tồn tại" });
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: "Lỗi lấy thông tin người bán" });
  }
});

// 8. TẠO API LẤY GIỎ HÀNG
app.get("/api/cart", authenticateToken, async (req, res) => {
  try {
    const cartItems = await prisma.cartItem.findMany({
      where: { user_id: req.userId },
      include: {
        product: {
          // --- THÊM DÒNG NÀY ĐỂ LẤY TÊN SHOP ---
          include: {
            createdBy: { select: { full_name: true } },
          },
          // ------------------------------------
        },
      },
    });
    res.json(cartItems);
  } catch (error) {
    res.status(500).json({ error: "Lỗi khi lấy giỏ hàng" });
  }
});

// 9. TẠO API THÊM VÀO GIỎ HÀNG
app.post("/api/cart/add", authenticateToken, async (req, res) => {
  try {
    const { product_id, quantity } = req.body;
    const userId = req.userId;

    // Kiểm tra xem sản phẩm này đã có trong giỏ của user chưa
    const existingItem = await prisma.cartItem.findFirst({
      where: { user_id: userId, product_id: product_id },
    });

    if (existingItem) {
      // Nếu đã có, cập nhật số lượng
      await prisma.cartItem.update({
        where: { id: existingItem.id },
        data: { quantity: existingItem.quantity + quantity },
      });
    } else {
      // Nếu chưa có, tạo mới
      await prisma.cartItem.create({
        data: {
          user_id: userId,
          product_id: product_id,
          quantity: quantity,
        },
      });
    }
    res.status(201).json({ message: "Đã thêm vào giỏ" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Lỗi khi thêm vào giỏ hàng" });
  }
});

// 10. TẠO API XÓA KHỎI GIỎ HÀNG
// Chúng ta sẽ xóa bằng ID của CartItem (ví dụ /api/cart/item/5)
app.delete("/api/cart/item/:id", authenticateToken, async (req, res) => {
  try {
    const cartItemId = parseInt(req.params.id);
    const userId = req.userId;

    // Kiểm tra xem item này có thực sự thuộc về user đang đăng nhập không
    const cartItem = await prisma.cartItem.findUnique({
      where: { id: cartItemId },
    });

    if (!cartItem || cartItem.user_id !== userId) {
      return res.status(404).json({ error: "Không tìm thấy mục trong giỏ" });
    }

    // Nếu đúng, xóa
    await prisma.cartItem.delete({
      where: { id: cartItemId },
    });

    res.json({ message: "Đã xóa khỏi giỏ" });
  } catch (error) {
    res.status(500).json({ error: "Lỗi khi xóa khỏi giỏ hàng" });
  }
});

// 14. API ĐẶT HÀNG (CHECKOUT - TÁCH ĐƠN THEO SHOP)
app.post("/api/orders/checkout", authenticateToken, async (req, res) => {
  const userId = req.userId;

  try {
    // 1. Kiểm tra địa chỉ
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user.address || user.address.trim() === "") {
      return res.status(400).json({ error: "Vui lòng cập nhật địa chỉ giao hàng trong Hồ sơ!" });
    }

    // 2. Bắt đầu Giao dịch (Transaction)
    const result = await prisma.$transaction(async (tx) => {
      // Lấy giỏ hàng (Kèm thông tin người bán của sản phẩm)
      const cartItems = await tx.cartItem.findMany({
        where: { user_id: userId },
        include: {
          product: {
            include: { createdBy: true }, // Lấy thông tin người bán
          },
        },
      });

      if (cartItems.length === 0) throw new Error("Giỏ hàng trống!");

      // --- GOM NHÓM THEO SHOP (SELLER) ---
      // Kết quả: { sellerId_1: [item1, item2], sellerId_2: [item3] }
      const ordersBySeller = {};

      for (const item of cartItems) {
        // Nếu sản phẩm không có người bán (do Admin tạo hoặc lỗi), gán vào nhóm "System" (ID 0 hoặc null)
        const sellerId = item.product.createdById || "system";

        if (!ordersBySeller[sellerId]) {
          ordersBySeller[sellerId] = [];
        }
        ordersBySeller[sellerId].push(item);
      }

      // --- TẠO ĐƠN HÀNG CHO TỪNG SHOP ---
      const createdOrders = [];

      for (const sellerIdKey in ordersBySeller) {
        const shopItems = ordersBySeller[sellerIdKey];

        // Tính tổng tiền cho đơn hàng của Shop này
        const shopTotal = shopItems.reduce((sum, item) => sum + Number(item.product.price) * item.quantity, 0);

        // Tạo Order
        const newOrder = await tx.order.create({
          data: {
            user_id: userId,
            total_price: shopTotal,
            status: "pending",
          },
        });

        // Tạo OrderItem
        const orderItemsData = shopItems.map((item) => ({
          order_id: newOrder.id,
          product_id: item.product_id,
          quantity: item.quantity,
          price_at_purchase: Number(item.product.price),
        }));
        await tx.orderItem.createMany({ data: orderItemsData });

        createdOrders.push(newOrder);

        // Trừ kho (Logic cũ)
        for (const item of shopItems) {
          const product = await tx.product.findUnique({
            where: { id: item.product_id },
          });
          if (!product || product.isDeleted || product.stock_quantity < item.quantity) {
            throw new Error(`Sản phẩm ${product?.name || "này"} không đủ số lượng!`);
          }
          await tx.product.update({
            where: { id: item.product_id },
            data: { stock_quantity: { decrement: item.quantity } },
          });
        }
      }

      // Xóa sạch giỏ hàng sau khi tạo xong tất cả đơn
      await tx.cartItem.deleteMany({ where: { user_id: userId } });

      return createdOrders;
    });

    res.status(201).json({
      message: `Đã đặt thành công ${result.length} đơn hàng!`,
      orders: result,
    });
  } catch (error) {
    console.error("Checkout error:", error);
    const msg = error.message.includes("Giỏ hàng") || error.message.includes("Sản phẩm") ? error.message : "Lỗi server khi đặt hàng";
    res.status(400).json({ error: msg });
  }
});

// API Lấy danh sách danh mục
app.get("/api/categories", async (req, res) => {
  try {
    const categories = await prisma.category.findMany();
    res.json(categories);
  } catch (error) {
    res.status(500).json({ error: "Lỗi lấy danh mục" });
  }
});

// --- THÊM API TẠO DANH MỤC MỚI (Admin & Sales) ---
app.post("/api/categories", authenticateToken, authorizeRole(["admin", "sales"]), async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) return res.status(400).json({ error: "Tên danh mục không được để trống" });

    // Kiểm tra xem danh mục đã tồn tại chưa
    const existingCat = await prisma.category.findUnique({ where: { name } });
    if (existingCat) return res.status(400).json({ error: "Danh mục này đã tồn tại" });

    const newCategory = await prisma.category.create({
      data: { name },
    });
    res.json(newCategory);
  } catch (error) {
    res.status(500).json({ error: "Lỗi tạo danh mục" });
  }
});

// 15. Lấy lịch sử mua hàng CỦA TÔI
app.get("/api/orders/my-history", authenticateToken, async (req, res) => {
  try {
    const orders = await prisma.order.findMany({
      where: { user_id: req.userId },
      include: {
        items: {
          include: {
            product: true, // <--- QUAN TRỌNG: Lấy chi tiết sản phẩm
          },
        },
      },
      orderBy: { order_date: "desc" },
    });
    res.json(orders);
  } catch (error) {
    console.error("Lỗi lấy history:", error);
    res.status(500).json({ error: "Lỗi lấy lịch sử đơn hàng" });
  }
});

// 16. Lấy danh sách đơn hàng (Phân quyền: Admin thấy hết, Sales chỉ thấy đơn có hàng của mình)
app.get(
  "/api/admin/orders",
  authenticateToken,
  authorizeRole(["admin"] /*, "sales"] */), // Cho phép cả Sales
  async (req, res) => {
    try {
      const { userId, userRole } = req;

      let whereClause = {};

      // // --- LOGIC PHÂN QUYỀN ---
      // if (userRole === "sales") {
      //   // Nếu là Sales: Chỉ lấy những đơn hàng mả trong đó CÓ ÍT NHẤT 1 sản phẩm do mình tạo
      //   whereClause = {
      //     items: {
      //       some: {
      //         product: {
      //           createdById: userId,
      //         },
      //       },
      //     },
      //   };
      // }
      // Nếu là Admin: whereClause = {} (Lấy hết)
      // ------------------------

      const orders = await prisma.order.findMany({
        where: whereClause, // Áp dụng bộ lọc
        include: {
          user: {
            select: { full_name: true, email: true, phone_number: true },
          },
          items: {
            include: {
              product: true, // Lấy chi tiết sản phẩm để hiển thị
            },
          },
        },
        orderBy: { order_date: "desc" },
      });

      res.json(orders);
    } catch (error) {
      console.error("Lỗi lấy admin orders:", error);
      res.status(500).json({ error: "Lỗi lấy danh sách đơn hàng" });
    }
  }
);

// 17. Cập nhật trạng thái đơn hàng (Admin VÀ Sales đều được)
app.put(
  "/api/admin/orders/:id/status",
  authenticateToken,
  authorizeRole(["admin"] /*, "sales"]*/), // <--- THÊM 'sales' VÀO ĐÂY
  async (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;

      // (Nâng cao: Có thể thêm logic kiểm tra nếu là Sales thì không được chọn 'cancelled')

      const updatedOrder = await prisma.order.update({
        where: { id: parseInt(id) },
        data: { status: status },
      });
      res.json(updatedOrder);
    } catch (error) {
      res.status(500).json({ error: "Lỗi cập nhật trạng thái" });
    }
  }
);
// --- API THỐNG KÊ (DASHBOARD) - HỖ TRỢ CẢ ADMIN VÀ SALES ---
app.get("/api/admin/stats", authenticateToken, authorizeRole(["admin", "sales"]), async (req, res) => {
  try {
    const { userId, userRole } = req;

    let stats = {
      revenue: 0,
      orders: 0,
      products: 0,
      customers: 0,
      recentOrders: [],
      chartData: [], // Dữ liệu để vẽ biểu đồ
    };

    if (userRole === "admin") {
      // --- LOGIC CHO ADMIN (Lấy hết) ---
      const totalRevenue = await prisma.order.aggregate({
        _sum: { total_price: true },
        where: { status: { not: "cancelled" } },
      });
      stats.revenue = totalRevenue._sum.total_price || 0;
      stats.orders = await prisma.order.count();
      stats.products = await prisma.product.count({
        where: { isDeleted: false },
      });
      stats.customers = await prisma.user.count({
        where: { role: "customer" },
      });

      // Lấy 5 đơn mới nhất
      stats.recentOrders = await prisma.order.findMany({
        take: 5,
        orderBy: { order_date: "desc" },
        include: { user: { select: { full_name: true } } },
      });
    } else {
      // --- LOGIC CHO SALES (Chỉ lấy của mình) ---

      // 1. Tính tổng sản phẩm của mình
      stats.products = await prisma.product.count({
        where: { createdById: userId, isDeleted: false },
      });

      // 2. Lấy tất cả OrderItem thuộc về sản phẩm của Sales này (để tính tiền)
      // Chỉ tính đơn đã giao hoặc đang xử lý (không tính đơn hủy)
      const myOrderItems = await prisma.orderItem.findMany({
        where: {
          product: { createdById: userId }, // Sản phẩm của tôi
          order: { status: { not: "cancelled" } }, // Đơn chưa hủy
        },
        include: { order: true },
      });

      // 3. Tính tổng doanh thu từ các item đó
      stats.revenue = myOrderItems.reduce((sum, item) => {
        return sum + Number(item.price_at_purchase) * item.quantity;
      }, 0);

      // 4. Đếm số đơn hàng (Unique Order ID)
      const uniqueOrderIds = new Set(myOrderItems.map((item) => item.order_id));
      stats.orders = uniqueOrderIds.size;

      // 5. Đếm số khách đã mua (Unique User ID)
      const uniqueCustomerIds = new Set(myOrderItems.map((item) => item.order.user_id));
      stats.customers = uniqueCustomerIds.size;

      // 6. Lấy đơn hàng gần đây (để hiển thị list)
      // Lấy 5 orderId mới nhất
      const recentOrderIds = Array.from(uniqueOrderIds).slice(0, 5);
      stats.recentOrders = await prisma.order.findMany({
        where: { id: { in: recentOrderIds } },
        include: { user: { select: { full_name: true } } },
        orderBy: { order_date: "desc" },
      });
    }

    // --- TẠO DỮ LIỆU BIỂU ĐỒ (Giả lập dữ liệu 7 ngày gần đây) ---
    // (Trong thực tế bạn sẽ query group by date, nhưng ở đây mình làm giả lập cho đơn giản để demo)
    stats.chartData = [
      { name: "T2", doanhThu: stats.revenue * 0.1 },
      { name: "T3", doanhThu: stats.revenue * 0.2 },
      { name: "T4", doanhThu: stats.revenue * 0.15 },
      { name: "T5", doanhThu: stats.revenue * 0.25 },
      { name: "T6", doanhThu: stats.revenue * 0.1 },
      { name: "T7", doanhThu: stats.revenue * 0.2 },
      { name: "CN", doanhThu: 0 },
    ];

    res.json(stats);
  } catch (error) {
    console.error("Lỗi thống kê:", error);
    res.status(500).json({ error: "Lỗi lấy thống kê" });
  }
});
// --- API ĐÁNH GIÁ SẢN PHẨM (Logic thủ công: Tìm -> Sửa hoặc Thêm) ---
app.post("/api/reviews", authenticateToken, async (req, res) => {
  try {
    const { productId, rating, comment } = req.body;
    const userId = req.userId;
    const pId = parseInt(productId);

    // 1. Kiểm tra điều kiện: Đã mua và Đã giao hàng chưa?
    const hasPurchased = await prisma.order.findFirst({
      where: {
        user_id: userId,
        status: "delivered", // Phải chính xác chữ 'delivered'
        items: { some: { product_id: pId } },
      },
    });

    if (!hasPurchased) {
      return res.status(400).json({
        error: "Bạn chỉ được đánh giá khi đơn hàng đã giao thành công!",
      });
    }

    // 2. Kiểm tra xem đã đánh giá chưa (Thay cho upsert)
    const existingReview = await prisma.review.findFirst({
      where: {
        userId: userId,
        productId: pId,
      },
    });

    let review;
    if (existingReview) {
      // A. NẾU CÓ RỒI -> GỌI LỆNH UPDATE (SỬA)
      review = await prisma.review.update({
        where: { id: existingReview.id }, // Dùng ID của review để sửa
        data: {
          rating: parseInt(rating),
          comment: comment,
          createdAt: new Date(),
        },
      });
    } else {
      // B. NẾU CHƯA CÓ -> GỌI LỆNH CREATE (TẠO MỚI)
      review = await prisma.review.create({
        data: {
          userId: userId,
          productId: pId,
          rating: parseInt(rating),
          comment: comment,
        },
      });
    }

    res.json({ message: "Đánh giá thành công!", review });
  } catch (error) {
    console.error("Lỗi đánh giá:", error); // Xem lỗi chi tiết ở Terminal
    res.status(500).json({ error: "Lỗi server khi đánh giá" });
  }
});

// API Lấy đánh giá của 1 sản phẩm (Công khai)
app.get("/api/products/:id/reviews", async (req, res) => {
  try {
    const reviews = await prisma.review.findMany({
      where: { productId: parseInt(req.params.id) },
      include: { user: { select: { full_name: true, avatar_url: true } } },
      orderBy: { createdAt: "desc" },
    });
    res.json(reviews);
  } catch (error) {
    res.status(500).json({ error: "Lỗi lấy đánh giá" });
  }
});

// --- API SỬA ĐÁNH GIÁ (PUT) ---
app.put("/api/reviews/:id", authenticateToken, async (req, res) => {
  try {
    const reviewId = parseInt(req.params.id);
    const { rating, comment } = req.body;
    const userId = req.userId;

    // 1. Kiểm tra xem review này có tồn tại và có phải của người này không
    const existingReview = await prisma.review.findUnique({
      where: { id: reviewId },
    });

    if (!existingReview) {
      return res.status(404).json({ error: "Đánh giá không tồn tại" });
    }

    if (existingReview.userId !== userId) {
      return res.status(403).json({ error: "Bạn chỉ được sửa đánh giá của chính mình!" });
    }

    // 2. Thực hiện cập nhật
    const updatedReview = await prisma.review.update({
      where: { id: reviewId },
      data: {
        rating: parseInt(rating),
        comment: comment,
      },
    });

    res.json({
      message: "Cập nhật đánh giá thành công!",
      review: updatedReview,
    });
  } catch (error) {
    res.status(500).json({ error: "Lỗi khi sửa đánh giá" });
  }
});

// 5. Lắng nghe ở cổng đã chọn (đã có)
app.listen(port, () => {
  console.log(`Backend server đang chạy tại http://localhost:${port}`);
});
