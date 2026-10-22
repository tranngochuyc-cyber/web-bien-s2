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
- Shader mặt nước, tia sáng, sương mờ theo chiều sâu, hạt phù du và caustics tạo nhiều lớp sáng. Tầng ánh sáng có san hô nhánh cong, đá và đàn cá.
- Camera dịch theo cuộn trang và có thể đảo chiều. Chế độ giảm chuyển động/tạm dừng ngừng animation liên tục nhưng vẫn cho phép điều hướng theo cuộn.
- San hô được gộp geometry, đàn cá/đá dùng instancing và dao động cá chạy trên GPU. Render giới hạn pixel ratio và nhịp khung hình, dừng khi tab ẩn hoặc ngoài nội dung 3D.

## Tài nguyên và giấy phép

Model `public/models/manta-ray.glb` là **Manta Ray Birostris (animated)** của **Violaine**, bản glTF từ dự án Open Water. Giấy phép **CC BY-NC-SA 4.0** chỉ cho phép sử dụng phi thương mại với điều kiện ghi công và chia sẻ tương tự. Xem [ASSET_CREDITS.md](ASSET_CREDITS.md) để biết nguồn và điều kiện đầy đủ. Nếu dùng website vào mục đích thương mại, cần thay model hoặc xin giấy phép khác. Các thành phần môi trường còn lại được dựng bằng code. Máy triển khai không tìm thấy Blender trong PATH và các thư mục cài đặt thông thường.

## Kiểm tra và hình ảnh

- `npm run build` thành công.
- Đã kiểm tra trực quan trên desktop và khung mobile; điều hướng, tìm kiếm, lọc và modal hoạt động. Chưa kiểm tra trên thiết bị cảm ứng vật lý.
- [Trước nâng cấp](preview.png) · [Hero sau nâng cấp](preview-upgraded.png) · [Tầng ánh sáng sau nâng cấp](preview-sunlight-upgrade.png) · [Mobile sau nâng cấp](preview-mobile-upgrade.png)

## Giới hạn

Môi trường và san hô vẫn mang phong cách minh họa, chưa đạt mức photorealism của các website tham chiếu. Tầng chạng vạng còn ít nội dung. Model GLB khoảng 2 MB; bundle Three.js còn vượt ngưỡng cảnh báo 500 KB của Vite. Chưa đo Core Web Vitals trên dữ liệu người dùng thực.

## Tham khảo

- [OceanX 2025](https://2025.oceanx.org/)
- [The Sea We Breathe](https://www.bluemarinefoundation.com/the-sea-we-breathe/)
- [NOAA — Giant manta ray](https://www.fisheries.noaa.gov/species/giant-manta-ray)
