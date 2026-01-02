import React, { useState, useEffect } from "react";
import { Fab, Zoom } from "@mui/material"; // Fab = Floating Action Button (Nút tròn nổi)
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";

function ScrollToTopButton() {
  const [showButton, setShowButton] = useState(false);

  useEffect(() => {
    // Hàm kiểm tra vị trí cuộn
    const handleScroll = () => {
      // Nếu cuộn xuống quá 300px thì hiện nút
      if (window.scrollY > 300) {
        setShowButton(true);
      } else {
        setShowButton(false);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth", // Cuộn mượt
    });
  };

  return (
    <Zoom in={showButton}>
      <Fab
        color="primary"
        size="medium"
        onClick={scrollToTop}
        sx={{
          position: "fixed",
          bottom: 100, // Cách đáy 100px (để nằm trên nút Liên hệ ở 30px)
          right: 30, // Căn phải 30px
          zIndex: 1000,
        }}
      >
        <KeyboardArrowUpIcon />
      </Fab>
    </Zoom>
  );
}

export default ScrollToTopButton;
