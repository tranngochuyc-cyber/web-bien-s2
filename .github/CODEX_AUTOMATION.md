# Tự động giao việc cho Codex qua GitHub

Repository: https://github.com/tranngochuyc-cyber/web-bien-s2

## Cách hoạt động

1. ChatGPT kiểm tra tiến độ và tạo GitHub Issue do tài khoản chủ repository đứng tên, có tiêu đề bắt đầu bằng `[Codex]`.
2. GitHub Actions chạy workflow `.github/workflows/codex-issues.yml` trên máy chủ Linux tách biệt, không dùng chuột/màn hình hoặc Codex CLI trên máy Windows.
3. Workflow gọi `openai/codex-action` để thực hiện nội dung Issue, chạy `npm ci`, `npm run build` và `npm test --if-present`.
4. Nếu có thay đổi, workflow tạo nhánh `codex/issue-N-RUN_ID` và mở Pull Request; mã nguồn `main` và website đang chạy không bị sửa trước khi PR được merge.
5. Workflow để lại bình luận trong Issue khi hoàn thành. Theo dõi thông báo, PR và Actions trên GitHub.

## Cần thực hiện một lần trước khi có thể chạy

1. Tạo OpenAI API key tại https://platform.openai.com/api-keys với billing API được cấu hình phù hợp. **OpenAI API là hạn mức/chi phí riêng, không dùng token/quota của gói ChatGPT hoặc Codex desktop.**
2. Vào https://github.com/tranngochuyc-cyber/web-bien-s2/settings/secrets/actions > **New repository secret**, tên chính xác `CODEX_OPENAI_API_KEY`; dán key vào ô *Secret* và lưu. Không ghi key vào source code, Issue hoặc tin nhắn.
3. Vào https://github.com/tranngochuyc-cyber/web-bien-s2/settings/actions > **Workflow permissions**: bật **Read and write permissions** và **Allow GitHub Actions to create and approve pull requests** nếu các tùy chọn này xuất hiện và chưa được bật.
4. Để chạy nhiệm vụ Issue #1 hiện có, mở https://github.com/tranngochuyc-cyber/web-bien-s2/actions/workflows/codex-issues.yml > **Run workflow**, nhập số `1`. Những Issue mới có tiêu đề `[Codex]` do chủ repository tạo sẽ tự kích hoạt (không cần dán prompt trong Codex nữa).

## Giới hạn và bảo vệ tiến độ

- Workflow **không** điều khiển Codex CLI / Antigravity trong WSL của người dùng. Nó dùng Codex độc lập trên GitHub-hosted runner. Kết nối WSL là một hướng triển khai riêng và không nên nối self-hosted runner vào repository công khai.
- Chỉ Issue do chủ repository tạo, có tiêu đề `[Codex]`, mới được tự động thực thi. Job `workflow_dispatch` cũng bị giới hạn cho chủ repository.
- Codex được cấp quyền sửa trong workspace chạy tạm thời, không được quyền tự chỉnh workflow GitHub; thay đổi workflow sẽ bị từ chối khi tạo nhánh.
- Mọi thay đổi được đưa vào PR, không tự đẩy trực tiếp lên `main`. Đây là rào chắn để bảo toàn code và tránh việc build pass nhưng giao diện bị hỏng.
- Job có thể thất bại do API quota/billing, giới hạn GitHub Actions, thiếu quyền push/PR, mạng hoặc lỗi build. Không có cơ chế tự đợi đến thời điểm quota ChatGPT được làm mới rồi tiếp tục.
- Không cung cấp mô hình 3D riêng và không tự cài Blender. Codex sử dụng tài nguyên có trong repo và những dependency đã được cài.
