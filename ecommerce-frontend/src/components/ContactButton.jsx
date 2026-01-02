import React, { useState } from "react";
import { Box, Button, Typography, Zoom, Tooltip } from "@mui/material";
import HeadsetMicIcon from "@mui/icons-material/HeadsetMic";
import CloseIcon from "@mui/icons-material/Close";

function ContactButton() {
  const [isOpen, setIsOpen] = useState(false);

  // Thay số điện thoại của bạn vào đây (định dạng 0xxxx hoặc 84xxxx)
  const ZALO_NUMBER = "0823448678";

  const handleToggle = () => {
    setIsOpen(!isOpen);
  };

  const handleZaloClick = () => {
    // Mở link Zalo trong tab mới
    window.open(`https://zalo.me/${ZALO_NUMBER}`, "_blank");
  };

  return (
    <Box
      sx={{
        position: "fixed",
        bottom: 30,
        right: 30,
        zIndex: 1000,
        display: "flex",
        flexDirection: "column", // Xếp dọc (Zalo ở trên, nút Liên hệ ở dưới)
        alignItems: "flex-end", // Căn phải
        gap: 2,
      }}
    >
      {/* --- NÚT ZALO (Ẩn/Hiện) --- */}
      <Zoom in={isOpen}>
        <Box
          onClick={handleZaloClick}
          sx={{
            display: "flex",
            alignItems: "center",
            backgroundColor: "white",
            padding: "10px 20px",
            borderRadius: "50px",
            boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
            cursor: "pointer",
            transition: "transform 0.2s",
            "&:hover": { transform: "scale(1.05)" },
          }}
        >
          {/* Logo Zalo (Dùng ảnh online) */}
          <img
            src="https://upload.wikimedia.org/wikipedia/commons/9/91/Icon_of_Zalo.svg"
            alt="Zalo"
            style={{ width: 30, height: 30, marginRight: 10 }}
          />
          <Typography variant="subtitle1" fontWeight="bold" color="#0068FF">
            Chat Zalo
          </Typography>
        </Box>
      </Zoom>

      {/* --- NÚT LIÊN HỆ CHÍNH --- */}
      <Button
        variant="contained"
        color={isOpen ? "secondary" : "error"} // Đổi màu khi mở/đóng
        onClick={handleToggle}
        startIcon={isOpen ? <CloseIcon /> : <HeadsetMicIcon />}
        sx={{
          borderRadius: "50px",
          padding: "12px 24px",
          fontSize: "1rem",
          fontWeight: "bold",
          boxShadow: "0 4px 12px rgba(211, 47, 47, 0.4)",
          animation: isOpen ? "none" : "pulse 2s infinite", // Hiệu ứng nhịp tim thu hút
        }}
      >
        {isOpen ? "Đóng" : "Liên hệ"}
      </Button>

      {/* --- CSS Hiệu ứng nhịp tim --- */}
      <style>
        {`
          @keyframes pulse {
            0% { box-shadow: 0 0 0 0 rgba(211, 47, 47, 0.7); }
            70% { box-shadow: 0 0 0 15px rgba(211, 47, 47, 0); }
            100% { box-shadow: 0 0 0 0 rgba(211, 47, 47, 0); }
          }
        `}
      </style>
    </Box>
  );
}

export default ContactButton;
