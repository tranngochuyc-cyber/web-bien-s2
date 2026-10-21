# BIỂN — WEB_BIEN_S2

Website đại dương bằng Vite 7, Three.js, JavaScript và CSS.

## Xem trực tiếp

[Khám phá BIỂN — GitHub Pages](https://tranngochuyc-cyber.github.io/web-bien-s2/)

Website được triển khai tự động từ nhánh main bằng GitHub Actions.

## Chạy dự án

```sh
npm install
npm run dev
npm run build
npm run preview
```

Mở URL Local được Vite in trong terminal. Build production nằm trong dist/.

## Đã triển khai

- Hero 3D, shader mặt nước, tia sáng, hạt phù du.
- Cá đuối bằng lưới tham số với cánh biến dạng; sứa, san hô và đàn cá instanced.
- Camera đi xuống theo cuộn; điều hướng chọn tầng và quay lại mặt biển.
- Thư viện minh họa sinh vật với tìm kiếm có/không dấu, lọc, modal native.
- Nội dung bảo tồn và liên kết NOAA/Smithsonian.
- Bố cục desktop/mobile, focus bàn phím, reduced-motion, tạm dừng chuyển động, loading và thông báo fallback WebGL.
- Giới hạn pixel ratio; bỏ render khi tab ẩn hoặc đã qua nội dung 3D.

## Tài nguyên

Toàn bộ geometry và SVG được dựng bằng code trong src/, không dùng tài sản của hai website tham chiếu. Chưa tìm thấy Blender trong PATH/thư mục cài thông thường; không có GLB/texture bên ngoài. Hình ảnh mang tính minh họa nghệ thuật, không phải mô phỏng khoa học hoặc sinh vật chân thực.

## Kiểm tra thực tế

- npm install thành công, audit báo 0 lỗ hổng tại thời điểm cài.
- npm run build thành công. Chunk 3D tải động khoảng 516 KB minified, 132 KB gzip; Vite cảnh báo vượt 500 KB.
- Browser desktop 1265 px và khung hẹp khoảng 447 px hiển thị được WebGL và bố cục.
- Đã thao tác điều hướng tầng, quay lại hero, tìm manta, lọc biển sâu, mở hồ sơ sứa.
- Không ghi nhận console error/warn trong phiên kiểm tra.
- Đã sửa lỗi camera trễ khi nhảy cuộn xa; kiểm tra lại cảnh biển sâu.
- Ảnh giao diện: preview.png.

## Giới hạn cần tiếp tục

Chưa đạt độ chân thực và mức hoàn thiện hình ảnh của OceanX/The Sea We Breathe: sinh vật và san hô còn stylized; chưa có model GLB chất lượng cao, texture chi tiết hoặc trình xem model xoay tự do. Tầng chạng vạng còn ít nội dung. Chưa kiểm tra trên thiết bị cảm ứng vật lý, giả lập context loss hoặc toàn bộ luồng bàn phím. Chưa đo LCP/INP/CLS p75, không tuyên bố đạt Core Web Vitals. Cấu hình xuất bản: GitHub Pages.

## Tham khảo

- https://2025.oceanx.org/ — quan sát intro, bố cục chữ lớn và điều hướng chương; chưa xác minh toàn bộ pipeline rendering.
- https://www.bluemarinefoundation.com/the-sea-we-breathe/ — quan sát màn mở đầu và UI độ sâu; chưa khảo sát hết hành trình.
- https://www.fisheries.noaa.gov/species/giant-manta-ray
- https://oceanservice.noaa.gov/facts/jellyfish.html
- https://oceanservice.noaa.gov/facts/ocean-oxygen.html
- https://ocean.si.edu/ocean-life/fish

