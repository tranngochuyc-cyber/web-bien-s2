# BIỂN — WEB_BIEN_S2

Trải nghiệm khám phá đại dương bằng Vite, Three.js, JavaScript và CSS. Dự án hiện có được nâng cấp ở cảnh Hero và tầng ánh sáng; thư viện sinh vật, tìm kiếm, bộ lọc, modal và điều hướng vẫn được giữ lại.

## Xem trực tiếp

[Khám phá BIỂN trên GitHub Pages](https://tranngochuyc-cyber.github.io/web-bien-s2/)

Nhánh `main` được xuất bản bằng GitHub Actions.

## Chạy tại máy

```sh
npm install
npm run dev
npm run build
npm run preview
```

## Cảnh 3D

- Hero dùng model cá đuối manta GLB có texture, xương và animation bơi. Three.js `GLTFLoader` tải model, `AnimationMixer` phát animation; một bản sao xuất hiện ở xa để tăng quy mô cảnh.
- Shader mặt nước, tia sáng, sương mờ theo chiều sâu, hạt phù du và caustics tạo nhiều lớp sáng. Tầng ánh sáng có địa hình đáy biển gợn nhẹ, đá, đàn cá và ba mẫu san hô quét 3D bên cạnh san hô dựng bằng code.
- Camera dịch theo cuộn trang và có thể đảo chiều. Chế độ giảm chuyển động/tạm dừng ngừng animation liên tục nhưng vẫn cho phép điều hướng theo cuộn.
- San hô dựng bằng code được gộp geometry; đàn cá/đá dùng instancing và dao động cá chạy trên GPU. Mẫu san hô tải khi vào tầng ánh sáng. Render giới hạn pixel ratio và nhịp khung hình; vòng lặp khung hình dừng khi tạm dừng, tab ẩn hoặc cuộn ra ngoài cảnh 3D.

## Tài nguyên và giấy phép

Model `public/models/manta-ray.glb` là **Manta Ray Birostris (animated)** của **Violaine**, bản glTF từ dự án Open Water. Giấy phép **CC BY-NC-SA 4.0** chỉ cho phép sử dụng phi thương mại với điều kiện ghi công và chia sẻ tương tự. Ba mẫu san hô quét 3D của **Smithsonian Institution** có giấy phép **CC0 1.0**; bản GLB tối ưu lấy từ dự án web-ocean-3d. Xem [ASSET_CREDITS.md](ASSET_CREDITS.md) để biết nguồn, giấy phép và các bản chỉnh sửa. Nếu dùng website vào mục đích thương mại, cần thay model manta hoặc xin giấy phép khác. Các thành phần môi trường khác được dựng bằng code. Máy triển khai không tìm thấy Blender trong PATH và các thư mục cài đặt thông thường.

## Kiểm tra và hình ảnh

- `npm run build` thành công. Bản build chia tầng san hô thành chunk tải muộn khoảng 86 KB (32 KB gzip); chunk cảnh chính khoảng 631 KB (165 KB gzip), còn vượt cảnh báo 500 KB của Vite.
- Kiểm tra trên trình duyệt desktop và viewport 390 × 844, 320 × 700: Hero, tầng ánh sáng, nút bắt đầu/tạm dừng, cuộn xuôi/ngược, nhảy anchor, thay đổi viewport, tìm kiếm, lọc và modal. Không có lỗi shader hoặc WebGL trong lần kiểm tra bản build sạch. Đã mô phỏng mất/khôi phục WebGL context; cảnh khôi phục không phát sinh cảnh báo console. Chế độ giảm chuyển động dừng vòng render liên tục; cuộn ngoài cảnh cũng dừng vòng render.
- Số đo trên trình duyệt thử nghiệm tại localhost với `?perf=1`: manta GLB 2,004,784 byte, tải và giải mã khoảng 95–105 ms khi đã có cache; GPU Hero khoảng 0.6 ms/khung hình, CPU gọi render thường khoảng 0.5–1.2 ms. Đây không phải số đo từ mạng thực hoặc thiết bị di động vật lý.
- [Hero trước](preview-upgraded.png) · [Hero hiện tại](preview-hero-stability.png) · [Tầng ánh sáng trước](preview-sunlight-upgrade.png) · [Tầng ánh sáng hiện tại](preview-sunlight-stability.png) · [Mobile trước](preview-mobile-upgrade.png) · [Mobile hiện tại](preview-mobile-stability.png) · [Tầng ánh sáng mobile](preview-sunlight-mobile-stability.png)

## Giới hạn

Môi trường vẫn mang phong cách minh họa, chưa đạt mức photorealism của các website tham chiếu. Tầng chạng vạng còn ít nội dung. Ba mẫu san hô tải thêm khoảng 1.28 MB và bộ giải mã KTX2 khoảng 585 KB khi vào tầng ánh sáng. Chưa kiểm tra trên thiết bị cảm ứng vật lý, chưa đo Core Web Vitals trên dữ liệu người dùng thực hoặc thử trạng thái tab ẩn bằng một tab nền thực sự.

## Tham khảo

- [OceanX 2025](https://2025.oceanx.org/)
- [The Sea We Breathe](https://www.bluemarinefoundation.com/the-sea-we-breathe/)
- [NOAA — Giant manta ray](https://www.fisheries.noaa.gov/species/giant-manta-ray)
