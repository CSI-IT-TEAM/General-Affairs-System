import { Box, Card, CardContent, Typography } from "@mui/material";
import ButtonSecondary from "../../Button/Secondary";
import { useTranslation } from "react-i18next";
import { useState, useEffect, useRef } from "react";

import "./CardPrimary.scss";

// Hàm lấy màu dominant từ ảnh
const getDominantColor = (imageSrc, callback) => {
  const img = new Image();
  
  // Chỉ set crossOrigin nếu ảnh từ domain khác
  if (imageSrc.startsWith('http') && !imageSrc.includes(window.location.hostname)) {
    img.crossOrigin = "anonymous";
  }
  
  img.onload = () => {
    try {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      
      // Giảm kích thước để tăng tốc xử lý (tối đa 100x100)
      const maxSize = 100;
      const scale = Math.min(maxSize / img.width, maxSize / img.height, 1);
      canvas.width = Math.max(1, Math.floor(img.width * scale));
      canvas.height = Math.max(1, Math.floor(img.height * scale));
      
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;
      
      // Đếm màu theo bucket (nhóm màu tương tự)
      const colorMap = {};
      const bucketSize = 15; // Nhóm màu trong khoảng 15 để giảm độ chi tiết
      
      for (let i = 0; i < data.length; i += 4) {
        const r = Math.floor(data[i] / bucketSize) * bucketSize;
        const g = Math.floor(data[i + 1] / bucketSize) * bucketSize;
        const b = Math.floor(data[i + 2] / bucketSize) * bucketSize;
        const a = data[i + 3];
        
        // Bỏ qua pixel trong suốt hoặc quá tối/sáng
        if (a < 100) continue;
        const brightness = (r + g + b) / 3;
        if (brightness < 40 || brightness > 220) continue;
        
        const colorKey = `${r},${g},${b}`;
        colorMap[colorKey] = (colorMap[colorKey] || 0) + 1;
      }
      
      // Tìm màu xuất hiện nhiều nhất
      let maxCount = 0;
      let dominantColor = { r: 245, g: 247, b: 250 }; // Màu mặc định
      
      for (const [color, count] of Object.entries(colorMap)) {
        if (count > maxCount) {
          maxCount = count;
          const [r, g, b] = color.split(",").map(Number);
          dominantColor = { r, g, b };
        }
      }
      
      // Đảm bảo màu không quá tối hoặc quá sáng
      const avgBrightness = (dominantColor.r + dominantColor.g + dominantColor.b) / 3;
      if (avgBrightness < 50) {
        // Nếu quá tối, làm sáng lên một chút
        dominantColor.r = Math.min(255, dominantColor.r + 30);
        dominantColor.g = Math.min(255, dominantColor.g + 30);
        dominantColor.b = Math.min(255, dominantColor.b + 30);
      } else if (avgBrightness > 230) {
        // Nếu quá sáng, làm tối đi một chút
        dominantColor.r = Math.max(0, dominantColor.r - 20);
        dominantColor.g = Math.max(0, dominantColor.g - 20);
        dominantColor.b = Math.max(0, dominantColor.b - 20);
      }
      
      callback(dominantColor);
    } catch (error) {
      console.error("Error extracting color:", error);
      callback({ r: 245, g: 247, b: 250 }); // Màu mặc định nếu lỗi
    }
  };
  
  img.onerror = () => {
    callback({ r: 245, g: 247, b: 250 }); // Màu mặc định nếu lỗi load ảnh
  };
  
  img.src = imageSrc;
};

const CardPrimary = ({ data, handleClick }) => {
  /////// Translate Lang
  const { t } = useTranslation();
  
  // State để lưu màu dominant - tạm thời dùng màu cố định
  const [dominantColor, setDominantColor] = useState({ r: 245, g: 247, b: 250 });
  const imgRef = useRef(null);
  
  // Tạm thời: Gán màu cố định dựa trên data.id
  useEffect(() => {
    const colorMap = {
      "001": { r: 100, g: 181, b: 246 },   // Xanh dương nhạt (Vehicle)
      "002": { r: 239, g: 154, b: 154 },   // Đỏ nhạt (Medical)
      "003": { r: 129, g: 199, b: 132 },   // Xanh lá nhạt (Flight)
      "004": { r: 255, g: 183, b: 77 },    // Cam nhạt (Pickleball)
      "005": { r: 255, g: 183, b: 77 },    // Cam nhạt (Meeting Room)
      "006": { r: 186, g: 124, b: 246 },    // Tím nhạt (Temporary Residence)
      "007": { r: 255, g: 183, b: 77 },    // Cam nhạt (Canteen Attendance)
    };
    
    const color = colorMap[data.id] || { r: 245, g: 247, b: 250 };
    setDominantColor(color);
  }, [data.id]);

  /////// Handle Content
  const handleContent = (type) => {
    let title = "",
      desc = "";

    switch (data.id) {
      case "001":
        title = t("vehicle_title");
        desc = t("vehicle_desc");
        break;
      case "002":
        title = t("medical_title");
        desc = t("medical_desc");
        break;
      case "003":
        title = t("flight_title");
        desc = t("flight_desc");
        break;
      case "004":
        title = t("pickleball_title");
        desc = t("pickleball_desc");
        break;
      case "005":
        title = t("meeting_room_title");
        desc = t("meeting_room_desc");
        break;
        case "006":
          title = t("business_immigration_declaration_title"); // Business immigration declaration

          desc = t("business_immigration_declaration_desc"); // Business immigration declaration
          break;
      case "007":
        title = t("canteen_attendance_title");
        desc = t("canteen_attendance_desc");
        break;
      case "008":
        title = t("business_trip_title");
        desc = t("business_trip_desc");
        break;
      default:
        break;
    }

    return type === "title" ? title : desc;
  };

  const cardTitle = handleContent("title");
  const cardDesc = handleContent("desc");

  // Tạm thời comment lại logic lấy màu từ ảnh
  // useEffect(() => {
  //   if (data.thumb) {
  //     getDominantColor(data.thumb, (color) => {
  //       setDominantColor(color);
  //     });
  //   }
  // }, [data.thumb]);

  // Sử dụng bgColor từ data cho dải màu
  const accentColor = data.bgColor || '#00c0c0';

  return (
    <>
      <Card className="b-card" onClick={handleClick} sx={{ height: '100%' }}>
        {/* IMAGE SECTION với background màu - ở trên cùng */}
        <Box 
          className="b-image-container"
          sx={{ backgroundColor: accentColor }}
        >
          <Box className="b-image-wrapper">
            <img 
              ref={imgRef}
              src={data.thumb} 
              alt={data.title} 
              className="b-image"
            />
          </Box>
        </Box>

        {/* TITLE SECTION - ở dưới image */}
        <Box className="b-header">
          <Typography
            variant="h5"
            component="h3"
            className="b-title"
          >
            {cardTitle}
          </Typography>
        </Box>

        {/* DESCRIPTION - ở dưới title */}
        <CardContent className="b-content">
          <Typography
            variant="body2"
            className={`b-desc ${data.id === "002" ? "b-desc--red" : ""}`}
          >
            {cardDesc}
          </Typography>
        </CardContent>

        {/* BUTTON - ở dưới cùng */}
        <Box className="b-bot">
          <ButtonSecondary title={t(data.btn_order_text)} />
        </Box>
      </Card>
    </>
  );
};

export default CardPrimary;
