# WEB_BIEN_S2 — ChatGPT → GitHub → Codex tự động

## Luồng chính: Codex CLI trong WSL (dùng tài khoản Codex đã đăng nhập)

1. ChatGPT kiểm tra website và tạo GitHub Issue có tiêu đề bắt đầu bằng `[Codex]`, đứng tên chủ repository `tranngochuyc-cyber`.
2. Script `scripts/codex_issue_worker.py` trên WSL đọc GitHub Issues mỗi 60 giây, **chỉ nhận Issue của chủ repository**.
3. Worker tạo một bản clone riêng trong `~/.local/share/web-bien-s2-codex/repo`, không chiếm chuột/bàn phím và không làm thay đổi workspace bạn đang mở.
4. Worker dùng `codex exec --full-auto` với phiên Codex CLI đã đăng nhập trong WSL, giữ lại thay đổi sau lỗi và thử tiếp khi giới hạn sử dụng được khôi phục. Không hứa đoán chính xác giờ reset quota: khi gặp thông báo giới hạn, worker tạm lùi 15 phút rồi kiểm tra lại; lỗi khác thử lại sau 3 phút.
5. Sau khi Codex kết thúc, worker chạy `npm ci`, `npm run build` và `npm test --if-present`. Nếu build/test không đạt, nó quay lại Codex để sửa tiếp.
6. Khi thành công, worker đẩy code lên nhánh `codex/issue-N-wsl`, tạo Pull Request và bình luận liên kết vào Issue. **Không tự sửa trực tiếp nhánh main** để tránh làm hỏng website đang chạy.

## Thiết lập một lần trên Ubuntu/WSL

Dùng terminal WSL, không dùng Windows PowerShell cho các lệnh dưới đây.

**Điều kiện:** WSL có `git`, `gh` (GitHub CLI), `codex` (Codex CLI), `node/npm`, `python3`. `gh auth login` và `codex login` phải thành công trong **chính distro WSL** này.

```bash
gh auth login
codex login
gh repo clone tranngochuyc-cyber/web-bien-s2 ~/web-bien-s2-bridge
cd ~/web-bien-s2-bridge
bash scripts/setup_codex_worker.sh
```

Nếu đã có `~/web-bien-s2-bridge`, không clone lại: chạy `cd ~/web-bien-s2-bridge && git pull --ff-only && bash scripts/setup_codex_worker.sh` (chỉ khi working tree sạch).

Script kiểm tra đăng nhập và tạo systemd user service nếu WSL đang chạy systemd; nếu không, dùng `nohup` tạm thời. Để dịch vụ tự chạy sau khi Windows/WSL khởi động lại, cấu hình WSL systemd + user linger hoặc lệnh khởi động WSL lúc đăng nhập; nếu không, cần chạy lại script sau reboot.

**Theo dõi:** `journalctl --user -u web-bien-codex-worker -f` nếu dùng systemd; hoặc `tail -f ~/.local/share/web-bien-s2-codex/worker.log` nếu dùng nohup. Nhật ký từng nhiệm vụ lưu tại `~/.local/share/web-bien-s2-codex/issue-N.log`.

**Ngừng worker:** `systemctl --user stop web-bien-codex-worker` khi dùng systemd; ở chế độ nohup, tìm PID worker và dừng tiến trình Python tương ứng.

Nhiệm vụ hiện có: https://github.com/tranngochuyc-cyber/web-bien-s2/issues/1 . Sau khi script chạy thành công, worker sẽ tự thấy nhiệm vụ này nếu Issue vẫn đang mở.

## Luồng dự phòng: Codex chạy trên GitHub Actions (API riêng)

Workflow `.github/workflows/codex-issues.yml` hiện chỉ chạy thủ công qua **Actions → Codex Issue Worker → Run workflow** để tránh chạy trùng nhiệm vụ với WSL worker. Nhập Issue number, ví dụ `1`.

Luồng này yêu cầu **OpenAI API key có billing riêng** lưu trong GitHub Actions secret `CODEX_OPENAI_API_KEY`, cùng quyền GitHub Actions viết branch/tạo PR. API usage **không** phải hạn mức Codex trong ChatGPT. Đây là phương án bổ sung, không bắt buộc nếu WSL worker đang hoạt động.

- Tạo API key: https://platform.openai.com/api-keys
- Đặt secret: https://github.com/tranngochuyc-cyber/web-bien-s2/settings/secrets/actions
- Quyền Actions: https://github.com/tranngochuyc-cyber/web-bien-s2/settings/actions

## Lưu ý an toàn và giới hạn

- Worker không nhận lệnh từ người lạ; chỉ Issue của `tranngochuyc-cyber` với tiền tố `[Codex]` mới được chạy.
- Không kết nối self-hosted GitHub Actions runner với máy Windows cá nhân trong repository public.
- Mọi thay đổi đều nằm trên nhánh riêng/PR cho đến khi được merge. Github Pages chỉ cập nhật sau khi nhánh main đổi.
- Nếu cả Codex trên máy và worker cùng sửa **cùng một folder** sẽ dễ xung đột; worker sử dụng bản clone riêng để tránh điều này.
- Trình giám sát quota là cơ chế thử lại từ checkpoint, không phải API chính thức cho biết chính xác thời điểm quota phục hồi. Không thể tiếp tục nếu máy WSL tắt, tài khoản chưa đăng nhập, quyền GitHub hết hiệu lực, hoặc Codex CLI thay đổi cú pháp.
- Đây là cầu nối nhận task cho Codex; nó không tự giả định rằng Antigravity CLI có sẵn hoặc tự tạo điều phối đa AI từ đầu.
