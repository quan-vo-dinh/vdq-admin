# SỔ GỐC GIAO DỊCH VIETCOMBANK — BẢN CHỜ BẠN BỔ SUNG

> **Mục đích:** Đây là tài liệu Markdown để bạn tự sửa, ghi rõ ngữ cảnh và gửi lại. **KHÔNG PHẢI CSV NHẬP DASHBOARD**. Sau khi bạn bổ sung, mình sẽ chuẩn hóa lần cuối và mới xây dựng CSV import từ đầu (vì bạn đã xóa trắng dashboard).
>
> **Phạm vi:** 21/09/2026 đến 21/10/2026, theo ảnh thông báo biến động VCB bạn gửi, đối chiếu các giao dịch tra soát trước đó. Tài khoản gốc: **VCB ••••0502**. Mốc chốt ảnh 21/10 lúc 19:58:28.
>
> **Đếm giao dịch:** 65 biến động thực ghi trong ảnh; không thêm dòng trùng. Có 3 **khoản chênh suy ra từ số dư**, tách riêng ở mục cuối và **chưa được coi là giao dịch**.
>
> **CÁCH ĐIỀN:** Chỉ sửa văn bản trong cột **“Bạn điền / xác nhận”** hoặc phần câu hỏi phía dưới. Giữ nguyên **ID, ngày, số tiền và mã truy vết** để tránh mất liên kết đối soát. Ghi `không rõ` nếu bạn không nhớ. Có thể đổi mục đích/nhóm chi tiêu nếu gợi ý chưa đúng.

## A. Quy tắc phân loại bạn yêu cầu

Chỉ có **3 danh mục CHI TIÊU**: **Ăn uống**, **Di chuyển**, **Chi phí phát sinh**. Các khoản **nhận tiền / chuyển nội bộ / rút tiền mặt / hoàn trả / khoản riêng** để dấu **—** tại cột _Danh mục chi_ vì không được mặc định là chi phí; đây **không phải danh mục thứ tư**. Bản chất giao dịch được ghi ở cột khác để có thể tính số dư VCB chính xác.

- **Ăn uống:** bữa ăn, cà phê, đồ uống, nếu đã rõ nguồn chi.
- **Di chuyển:** xăng, xe khách và tiền đi lại xác định được.
- **Chi phí phát sinh:** các khoản chi khác (sửa điện thoại, mua sắm, dịch vụ, y tế, nạp điện thoại, giải trí, quà biếu…), và **tạm đặt** cho những khoản tiền ra chưa rõ, có gắn `[CẦN MÔ TẢ]` để bạn quyết định.

**Phải tách hai cách nhìn:** _Dòng tiền ngân hàng_ để khớp số dư (bao gồm mọi khoản vào/ra) và _báo cáo chi tiêu/thu nhập cá nhân_ để tránh tính chuyển ví, chuyển tài khoản, hoàn trả hai lần. Các khoản bạn muốn bù trừ (mẹ / vé xe) được ghi ở phần B, **không làm mất chứng từ ngân hàng**.

### Thống kê tạm theo đúng 3 danh mục (chưa phải số tổng kết cuối cùng)

| Danh mục chi      | VND ra từ VCB đã gán vào danh mục | Chú thích                                                                                 |
| ----------------- | --------------------------------: | ----------------------------------------------------------------------------------------- |
| Ăn uống           |                           388.000 | Có khoản Workafe 35.000đ cần bạn xác nhận là đồ uống                                      |
| Di chuyển         |                           549.000 | Đã gồm 235.000đ và 250.000đ tiền xe qua VCB; chưa cộng tiền mặt 15.000đ                   |
| Chi phí phát sinh |                         2.625.155 | **Đã gồm 1.000.000đ biếu mẹ chỉ tính qua giảm lương** và **535.600đ của 9 khoản chưa rõ** |

**Nếu chỉ lấy các khoản mua/chi đã có cơ sở xác định, bỏ khoản biếu mẹ đã bù lương và tạm chưa tính 9 khoản chưa rõ:** tổng chi đã nhận diện từ VCB là **2.026.555đ** (388.000 ăn uống + 549.000 di chuyển + 1.089.555 chi phí phát sinh). Đây **chưa phải tổng chi tiêu toàn bộ**, vì còn cần sao kê MoMo, cách xử lý ATM, 15.000đ tiền mặt, và các khoản chênh lệch sao kê.

## B. Các quy tắc bù trừ theo ngữ cảnh bạn đã xác nhận

### B1. Lương tháng 9 và 1.000.000đ biếu mẹ

| Khoản                                                 |        Giá trị | Cách hiểu                                                                                          |
| ----------------------------------------------------- | -------------: | -------------------------------------------------------------------------------------------------- |
| Lương tháng 9 thực lĩnh theo phiếu lương              |    +4.544.800đ | Ghi nhận thu nhập **một lần tại ACB** khi có ngày nhận thực tế; chưa có bản ghi VCB tương ứng      |
| Tiền chuyển mẹ ngày 30/09                             |    −1.000.000đ | Bạn muốn **trừ thẳng vào lương khả dụng**; vẫn là một biến động âm thật ở VCB                      |
| **Lương tháng 9 sau khoản biếu mẹ (chỉ số kế hoạch)** | **3.544.800đ** | 4.544.800 − 1.000.000; đây là **cách trình bày ngân sách**, không phải số lương ngân hàng thực trả |

**Không tính hai lần:** nếu biểu đồ dùng lương đã điều chỉnh 3.544.800đ thì **không trừ thêm 1.000.000đ biếu mẹ vào chi tiêu tổng**. Ngược lại, nếu lưu lương đúng nguyên gốc 4.544.800đ trong ứng dụng và trừ 1.000.000đ như một khoản chi, thì báo cáo cần tính theo cách đó. **Không làm đồng thời cả hai.**

Khoản **+4.870.000đ vào VCB ngày 01/10** là chuyển từ ACB (gồm tiền lương đã nhận trước đó và phần tiền dư), **không phải lương mới 4.870.000đ**. Chưa tự tạo giao dịch lương ACB vào CSV VCB khi chưa có sao kê ACB.

### B2. Gộp / bù trừ các khoản tiền xe khách về quê và lên lại TP.HCM

| Dòng tiền                                 |   Số tiền | Nhận xét                                                           |
| ----------------------------------------- | --------: | ------------------------------------------------------------------ |
| Cô Hương chuyển hỗ trợ (09/10)            | +500.000đ | Bạn đã nhận và giữ khoản này                                       |
| Chị Tâm gửi hỗ trợ (09/10)                | +500.000đ | Có khoản đối ứng trả lại cho chị                                   |
| Bạn chuyển trả chị Tâm (09/10)            | −500.000đ | Cặp chị Tâm ròng **0đ**                                            |
| Vé xe khách về quê (15/10) qua VCB        | −235.000đ | Còn **15.000đ tiền mặt trả riêng** như bạn xác nhận                |
| Vé xe khách lên TP.HCM (18/10) qua VCB    | −250.000đ | Vé chiều về lại TP.HCM                                             |
| Tiền mặt cho chuyến xe về quê (ngoài VCB) |  −15.000đ | Ghi chú phân bổ chi phí, **không thêm vào sổ biến động ngân hàng** |
| **Cân đối cuối cùng cho nhóm chuyến xe**  |    **0đ** | 500.000 + 500.000 − 500.000 − 235.000 − 250.000 − 15.000 = **0**   |

**Chỉ nhìn VCB:** nhóm trên ròng **+15.000đ**; trừ thêm 15.000đ thanh toán bằng tiền mặt thì **0đ**. **Không tạo thêm giao dịch thu 500.000đ hoặc ghi vé xe với số tiền 250.000đ đè lên dòng VCB 235.000đ**. Có thể giữ hai vé chi _Di chuyển_ theo giá gốc 250.000đ/chuyến khi thống kê nhu cầu đi lại, đồng thời hạch toán khoản hỗ trợ để tránh hiểu nhầm chi phí ròng.

**Cần bạn xác nhận:** 15.000đ tiền mặt là khoản bổ sung trực tiếp để đủ 250.000đ giá vé chuyến về quê, không phải một chi phí Grab độc lập đúng không? **Bạn điền:** `........................................`

### B3. Nguyên tắc với tiền nạp MoMo, rút tiền ATM và khoản riêng

- **VCB → MoMo (CashIn):** tiền rời VCB nhưng đến ví của bạn, **không phải chi tiêu mới**. Nếu sau đó bạn thanh toán ăn uống/xăng bằng MoMo, phải bổ sung từ sao kê **ví MoMo**; không đoán mục đích dựa trên số tiền nạp.
- **MoMo → VCB (CashOut):** tăng VCB, **không phải thu nhập mới**.
- **Rút ATM −403.300đ:** giảm số dư VCB, có thể chuyển thành tiền mặt; **chưa biết bao nhiêu là tiền mặt và bao nhiêu là phí**. Chờ bạn xác nhận.
- **−2.150.000đ ngày 01/10:** bạn yêu cầu **loại khỏi thống kê chi tiêu cá nhân**, nhưng vẫn bắt buộc giữ trong sổ VCB để số dư khớp.
- **+500.000đ của cô Hương:** thu thực tế/hỗ trợ gia đình; nhóm bù trừ tiền xe giữ một lần, không nhân đôi.

## C. Giao dịch 09/2026 — 19 dòng

| ID  | Ngày · giờ    |    +/- VND | Mô tả chuẩn                          | Danh mục chi      | Bản chất / lưu ý                                                                                                     | Bạn điền / xác nhận                                                                                                             |
| --- | ------------- | ---------: | ------------------------------------ | ----------------- | -------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| 01  | 21/09 · 11:38 |    −35.790 | Nạp tiền MoMo                        | —                 | Chuyển nội bộ VCB ↔ MoMo                                                                                             | (Nạp/rút ví — chỉ ghi mục đích nếu bạn muốn: `...`)                                                                             |
| 02  | 22/09 · 12:35 |    −50.000 | Ăn cơm gà                            | Ăn uống           | Chi tiêu                                                                                                             | — (sửa nếu mô tả sai)                                                                                                           |
| 03  | 23/09 · 12:11 |    −64.000 | Đổ xăng Tân Hiệp                     | Di chuyển         | Chi tiêu                                                                                                             | — (sửa nếu mô tả sai)                                                                                                           |
| 04  | 23/09 · 12:19 |    −10.000 | Chuyển Nguyễn Lê Bình Minh — chưa rõ | Chi phí phát sinh | Tiền ra, chưa rõ mục đích                                                                                            | **[CẦN MÔ TẢ]** Chuyển 10.000đ cho Nguyễn Lê Bình Minh để làm gì? **Trả lời:** `...`                                            |
| 05  | 23/09 · 13:19 |    −40.000 | Ăn xúc xích                          | Ăn uống           | Chi tiêu                                                                                                             | — (sửa nếu mô tả sai)                                                                                                           |
| 06  | 24/09 · 07:52 |    −73.000 | Thanh toán trạm y tế                 | Chi phí phát sinh | Chi tiêu                                                                                                             | — (sửa nếu mô tả sai)                                                                                                           |
| 07  | 24/09 · 11:20 |   −120.000 | Nạp tiền MoMo                        | —                 | Chuyển nội bộ VCB ↔ MoMo                                                                                             | (Nạp/rút ví — chỉ ghi mục đích nếu bạn muốn: `...`)                                                                             |
| 08  | 24/09 · 12:49 |    −40.000 | Nạp tiền MoMo                        | —                 | Chuyển nội bộ VCB ↔ MoMo                                                                                             | (Nạp/rút ví — chỉ ghi mục đích nếu bạn muốn: `...`)                                                                             |
| 09  | 25/09 · 11:33 |    −25.829 | Nạp tiền MoMo                        | —                 | Chuyển nội bộ VCB ↔ MoMo                                                                                             | (Nạp/rút ví — chỉ ghi mục đích nếu bạn muốn: `...`)                                                                             |
| 10  | 25/09 · 20:58 |    −21.000 | Nạp tiền MoMo                        | —                 | Chuyển nội bộ VCB ↔ MoMo                                                                                             | (Nạp/rút ví — chỉ ghi mục đích nếu bạn muốn: `...`)                                                                             |
| 11  | 26/09 · 09:31 |    −53.000 | Nạp tiền MoMo                        | —                 | Chuyển nội bộ VCB ↔ MoMo                                                                                             | (Nạp/rút ví — chỉ ghi mục đích nếu bạn muốn: `...`)                                                                             |
| 12  | 26/09 · 13:48 |    −37.000 | Nạp tiền MoMo                        | —                 | Chuyển nội bộ VCB ↔ MoMo                                                                                             | (Nạp/rút ví — chỉ ghi mục đích nếu bạn muốn: `...`)                                                                             |
| 13  | 26/09 · 13:57 |    −54.444 | YouTube Premium                      | Chi phí phát sinh | Chi tiêu                                                                                                             | **[XÁC NHẬN]** YouTube Premium 54.444đ: có phí chênh 9.900đ hay khoản phát sinh nào khác không? **Trả lời:** `...`              |
| 14  | 26/09 · 18:39 |    −35.000 | Nạp tiền MoMo                        | —                 | Chuyển nội bộ VCB ↔ MoMo                                                                                             | (Nạp/rút ví — chỉ ghi mục đích nếu bạn muốn: `...`)                                                                             |
| 15  | 27/09 · 16:31 |    −50.000 | Nạp tiền MoMo                        | —                 | Chuyển nội bộ VCB ↔ MoMo                                                                                             | (Nạp/rút ví — chỉ ghi mục đích nếu bạn muốn: `...`)                                                                             |
| 16  | 27/09 · 17:24 |   −180.000 | Nạp tiền MoMo                        | —                 | Chuyển nội bộ VCB ↔ MoMo                                                                                             | (Nạp/rút ví — chỉ ghi mục đích nếu bạn muốn: `...`)                                                                             |
| 17  | 27/09 · 23:01 |    −29.000 | Chuyển Lê Văn Tuấn — chưa rõ         | Chi phí phát sinh | Tiền ra, chưa rõ mục đích                                                                                            | **[CẦN MÔ TẢ]** Chuyển 29.000đ cho Lê Văn Tuấn để làm gì? Thông báo là 27/09 23:01; bảng tra soát ghi 28/09. **Trả lời:** `...` |
| 18  | 29/09 · 11:40 |    −36.240 | Nạp tiền MoMo                        | —                 | Chuyển nội bộ VCB ↔ MoMo                                                                                             | (Nạp/rút ví — chỉ ghi mục đích nếu bạn muốn: `...`)                                                                             |
| 19  | 30/09 · 15:31 | −1.000.000 | Biếu mẹ từ lương tháng 9             | Chi phí phát sinh | Bù trừ lương. Tính bằng cách giảm lương khả dụng 1.000.000đ; không cộng thêm vào chi phí báo cáo để khỏi tính 2 lần. | — (sửa nếu mô tả sai)                                                                                                           |

> **Tra cứu chống trùng:** ID ở bảng trên nối 1:1 với mã biến động ngân hàng trong mục E. Không nhập 2 lần một giao dịch có cùng mã tham chiếu.

## C. Giao dịch 10/2026 — 46 dòng

| ID  | Ngày · giờ    |    +/- VND | Mô tả chuẩn                        | Danh mục chi      | Bản chất / lưu ý                                                                                                                            | Bạn điền / xác nhận                                                                                                                                        |
| --- | ------------- | ---------: | ---------------------------------- | ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 20  | 01/10 · 07:34 |    −76.000 | Nạp tiền MoMo                      | —                 | Chuyển nội bộ VCB ↔ MoMo                                                                                                                    | (Nạp/rút ví — chỉ ghi mục đích nếu bạn muốn: `...`)                                                                                                        |
| 21  | 01/10 · 07:36 |    +76.000 | MoMo hoàn về VCB                   | —                 | Chuyển nội bộ VCB ↔ MoMo                                                                                                                    | (Nạp/rút ví — chỉ ghi mục đích nếu bạn muốn: `...`)                                                                                                        |
| 22  | 01/10 · 07:38 |    −78.000 | Nạp tiền MoMo                      | —                 | Chuyển nội bộ VCB ↔ MoMo                                                                                                                    | (Nạp/rút ví — chỉ ghi mục đích nếu bạn muốn: `...`)                                                                                                        |
| 23  | 01/10 · 07:42 |    +78.000 | MoMo hoàn về VCB                   | —                 | Chuyển nội bộ VCB ↔ MoMo                                                                                                                    | (Nạp/rút ví — chỉ ghi mục đích nếu bạn muốn: `...`)                                                                                                        |
| 24  | 01/10 · 07:44 |    −94.000 | Nạp tiền MoMo                      | —                 | Chuyển nội bộ VCB ↔ MoMo                                                                                                                    | (Nạp/rút ví — chỉ ghi mục đích nếu bạn muốn: `...`)                                                                                                        |
| 25  | 01/10 · 15:37 |    −19.600 | Thanh toán QR — chưa rõ            | Chi phí phát sinh | Tiền ra, chưa rõ mục đích                                                                                                                   | **[CẦN MÔ TẢ]** Thanh toán QR 19.600đ là mua món/dịch vụ gì, ở đâu? **Trả lời:** `...`                                                                     |
| 26  | 01/10 · 16:29 | +4.870.000 | Chuyển từ ACB sang VCB             | —                 | Chuyển nội bộ ACB → VCB. Tiền đã ở ACB (trong đó có lương tháng 9); không phải thu nhập mới tại VCB.                                        | (Nạp/rút ví — chỉ ghi mục đích nếu bạn muốn: `...`)                                                                                                        |
| 27  | 01/10 · 16:35 | −2.150.000 | Chuyển MoMo — khoản riêng          | —                 | Khoản riêng (loại khỏi ngân sách). Bạn yêu cầu bỏ khỏi báo cáo cá nhân; vẫn giảm số dư VCB.                                                 | **[XÁC NHẬN]** Khoản chuyển 2.150.000đ sang MoMo: chỉ xác nhận vẫn muốn loại khỏi ngân sách; không cần nói mục đích nếu là khoản riêng. **Trả lời:** `...` |
| 28  | 01/10 · 17:46 |    −28.000 | Nạp tiền MoMo                      | —                 | Chuyển nội bộ VCB ↔ MoMo                                                                                                                    | (Nạp/rút ví — chỉ ghi mục đích nếu bạn muốn: `...`)                                                                                                        |
| 29  | 01/10 · 20:04 |    −62.000 | Nạp tiền MoMo                      | —                 | Chuyển nội bộ VCB ↔ MoMo                                                                                                                    | (Nạp/rút ví — chỉ ghi mục đích nếu bạn muốn: `...`)                                                                                                        |
| 30  | 01/10 · 20:16 |    +62.000 | MoMo hoàn về VCB                   | —                 | Chuyển nội bộ VCB ↔ MoMo                                                                                                                    | (Nạp/rút ví — chỉ ghi mục đích nếu bạn muốn: `...`)                                                                                                        |
| 31  | 01/10 · 20:19 |    −82.000 | Nạp tiền MoMo                      | —                 | Chuyển nội bộ VCB ↔ MoMo                                                                                                                    | (Nạp/rút ví — chỉ ghi mục đích nếu bạn muốn: `...`)                                                                                                        |
| 32  | 01/10 · 21:34 |    −30.000 | Nạp tiền MoMo                      | —                 | Chuyển nội bộ VCB ↔ MoMo                                                                                                                    | (Nạp/rút ví — chỉ ghi mục đích nếu bạn muốn: `...`)                                                                                                        |
| 33  | 02/10 · 08:25 |    −42.000 | Ăn bún bò Huế                      | Ăn uống           | Chi tiêu                                                                                                                                    | — (sửa nếu mô tả sai)                                                                                                                                      |
| 34  | 02/10 · 08:49 |   −250.000 | Chuyển Trần Thị Kim Diệu — chưa rõ | Chi phí phát sinh | Tiền ra, chưa rõ mục đích                                                                                                                   | **[CẦN MÔ TẢ]** Chuyển 250.000đ cho Trần Thị Kim Diệu để làm gì? **Trả lời:** `...`                                                                        |
| 35  | 02/10 · 13:17 |    −40.000 | Ăn bún cá Cam Ranh                 | Ăn uống           | Chi tiêu                                                                                                                                    | — (sửa nếu mô tả sai)                                                                                                                                      |
| 36  | 03/10 · 08:30 |    −44.000 | Chuyển Đỗ Ngọc Hữu — chưa rõ       | Chi phí phát sinh | Tiền ra, chưa rõ mục đích                                                                                                                   | **[CẦN MÔ TẢ]** Chuyển 44.000đ cho Đỗ Ngọc Hữu để làm gì? **Trả lời:** `...`                                                                               |
| 37  | 03/10 · 16:07 |    −25.000 | Nạp tiền MoMo                      | —                 | Chuyển nội bộ VCB ↔ MoMo                                                                                                                    | (Nạp/rút ví — chỉ ghi mục đích nếu bạn muốn: `...`)                                                                                                        |
| 38  | 03/10 · 16:20 |    −18.000 | Nạp tiền MoMo                      | —                 | Chuyển nội bộ VCB ↔ MoMo                                                                                                                    | (Nạp/rút ví — chỉ ghi mục đích nếu bạn muốn: `...`)                                                                                                        |
| 39  | 04/10 · 12:53 |    −35.000 | Mua tại Workafe                    | Ăn uống           | Chi tiêu                                                                                                                                    | **[XÁC NHẬN]** Có đúng là mua cà phê/đồ uống ở Workafe không? **Trả lời:** `...`                                                                           |
| 40  | 06/10 · 12:23 |    −45.000 | Ăn hủ tiếu                         | Ăn uống           | Chi tiêu                                                                                                                                    | — (sửa nếu mô tả sai)                                                                                                                                      |
| 41  | 06/10 · 20:29 |    −25.000 | Mua tại Bách Hóa Xanh              | Chi phí phát sinh | Chi tiêu                                                                                                                                    | **[XÁC NHẬN]** Mua món gì tại Bách Hóa Xanh (25.000đ)? **Trả lời:** `...`                                                                                  |
| 42  | 07/10 · 13:03 |   −562.298 | Nạp tiền MoMo                      | —                 | Chuyển nội bộ VCB ↔ MoMo                                                                                                                    | (Nạp/rút ví — chỉ ghi mục đích nếu bạn muốn: `...`)                                                                                                        |
| 43  | 07/10 · 13:15 |    −45.000 | Chuyển Võ Chánh Tín — chưa rõ      | Chi phí phát sinh | Tiền ra, chưa rõ mục đích                                                                                                                   | **[CẦN MÔ TẢ]** Chuyển 45.000đ cho Võ Chánh Tín để làm gì? **Trả lời:** `...`                                                                              |
| 44  | 07/10 · 13:44 |    −54.000 | Nạp tiền MoMo                      | —                 | Chuyển nội bộ VCB ↔ MoMo                                                                                                                    | (Nạp/rút ví — chỉ ghi mục đích nếu bạn muốn: `...`)                                                                                                        |
| 45  | 07/10 · 18:21 |    −30.000 | Nạp điện thoại Viettel             | Chi phí phát sinh | Chi tiêu                                                                                                                                    | — (sửa nếu mô tả sai)                                                                                                                                      |
| 46  | 08/10 · 08:24 |   −403.300 | Rút tiền ATM                       | —                 | Rút tiền mặt. Rút tiền/chuyển tài sản sang tiền mặt, KHÔNG coi cả 403.300đ là chi tiêu.                                                     | **[XÁC NHẬN]** ATM trừ 403.300đ: nhận tiền mặt bao nhiêu? Có phí 3.300đ hay khoản khác? **Trả lời:** `...`                                                 |
| 47  | 09/10 · 18:30 |   −600.000 | Thay màn hình điện thoại           | Chi phí phát sinh | Chi tiêu                                                                                                                                    | — (sửa nếu mô tả sai)                                                                                                                                      |
| 48  | 09/10 · 19:20 |    −10.000 | Chuyển Nguyễn Trọng Bình — chưa rõ | Chi phí phát sinh | Tiền ra, chưa rõ mục đích                                                                                                                   | **[CẦN MÔ TẢ]** Chuyển 10.000đ cho Nguyễn Trọng Bình để làm gì? **Trả lời:** `...`                                                                         |
| 49  | 09/10 · 21:52 |   +500.000 | Cô Hương cho tiền                  | —                 | Tiền nhận từ gia đình. Quà tặng/hỗ trợ từ cô Hương, cộng vào bù trừ tiền xe một lần.                                                        | — (sửa nếu mô tả sai)                                                                                                                                      |
| 50  | 09/10 · 22:37 |   −500.000 | Chuyển trả chị Tâm                 | —                 | Bù trừ khoản hỗ trợ. Ngày 09/10 22:37, trả lại chị Tâm 500.000đ.                                                                            | — (sửa nếu mô tả sai)                                                                                                                                      |
| 51  | 09/10 · 22:44 |   +500.000 | Chị Tâm chuyển hỗ trợ tiền xe      | —                 | Bù trừ khoản hỗ trợ. Ngày 09/10 22:44, chị Tâm chuyển 500.000đ. Hai chuyển khoản cho/chuyển trả bù trừ về 0, không cộng thành thu nhập mới. | — (sửa nếu mô tả sai)                                                                                                                                      |
| 52  | 10/10 · 14:31 |    −25.000 | Chuyển Nguyễn Hoàng Phúc — chưa rõ | Chi phí phát sinh | Tiền ra, chưa rõ mục đích                                                                                                                   | **[CẦN MÔ TẢ]** Chuyển 25.000đ cho Nguyễn Hoàng Phúc để làm gì? **Trả lời:** `...`                                                                         |
| 53  | 12/10 · 12:38 |    −30.000 | Ăn hủ tiếu                         | Ăn uống           | Chi tiêu                                                                                                                                    | — (sửa nếu mô tả sai)                                                                                                                                      |
| 54  | 13/10 · 12:54 |    −40.000 | Ăn bún cá Cam Ranh                 | Ăn uống           | Chi tiêu                                                                                                                                    | — (sửa nếu mô tả sai)                                                                                                                                      |
| 55  | 14/10 · 12:42 |    −30.000 | Ăn bún D3                          | Ăn uống           | Chi tiêu                                                                                                                                    | — (sửa nếu mô tả sai)                                                                                                                                      |
| 56  | 15/10 · 14:10 |    −21.111 | Google One                         | Chi phí phát sinh | Chi tiêu                                                                                                                                    | **[XÁC NHẬN]** Google One 21.111đ: có phí chênh 9.900đ hay khoản phát sinh nào khác không? **Trả lời:** `...`                                              |
| 57  | 15/10 · 20:49 |   −235.000 | Xe khách TP.HCM → quê              | Di chuyển         | Chi tiêu. Chuyển khoản 235.000đ; theo bạn có 15.000đ trả tiền mặt riêng, tổng chi chuyến về quê 250.000đ.                                   | — (sửa nếu mô tả sai)                                                                                                                                      |
| 58  | 16/10 · 16:39 |     −8.000 | Mua nước ngọt Sting                | Ăn uống           | Chi tiêu                                                                                                                                    | — (sửa nếu mô tả sai)                                                                                                                                      |
| 59  | 17/10 · 21:44 |    −28.000 | Uống cà phê                        | Ăn uống           | Chi tiêu                                                                                                                                    | — (sửa nếu mô tả sai)                                                                                                                                      |
| 60  | 18/10 · 12:42 |    −30.000 | Nạp điện thoại Viettel             | Chi phí phát sinh | Chi tiêu                                                                                                                                    | — (sửa nếu mô tả sai)                                                                                                                                      |
| 61  | 18/10 · 15:32 |   −250.000 | Xe khách quê → TP.HCM              | Di chuyển         | Chi tiêu. Chi chuyến xe khách lên TP.HCM 250.000đ; nhóm cùng hai khoản hỗ trợ 500.000đ để tính bù trừ.                                      | — (sửa nếu mô tả sai)                                                                                                                                      |
| 62  | 18/10 · 19:48 |   −216.000 | Mua sáp vuốt tóc                   | Chi phí phát sinh | Chi tiêu                                                                                                                                    | — (sửa nếu mô tả sai)                                                                                                                                      |
| 63  | 20/10 · 19:44 |    −30.000 | Nạp game tại quán net              | Chi phí phát sinh | Chi tiêu                                                                                                                                    | — (sửa nếu mô tả sai)                                                                                                                                      |
| 64  | 20/10 · 19:53 |    −10.000 | Nạp game tại quán net              | Chi phí phát sinh | Chi tiêu                                                                                                                                    | — (sửa nếu mô tả sai)                                                                                                                                      |
| 65  | 21/10 · 19:58 |   −103.000 | Chuyển Nguyễn Quang Tùng — chưa rõ | Chi phí phát sinh | Tiền ra, chưa rõ mục đích                                                                                                                   | **[CẦN MÔ TẢ]** Chuyển 103.000đ cho Nguyễn Quang Tùng ngày 21/10 để làm gì? **Trả lời:** `...`                                                             |

> **Tra cứu chống trùng:** ID ở bảng trên nối 1:1 với mã biến động ngân hàng trong mục E. Không nhập 2 lần một giao dịch có cùng mã tham chiếu.

## D. Danh sách tập trung các điểm cần bạn trả lời

**Ưu tiên cao – 9 khoản tiền ra chưa có nội dung mua gì / chuyển vì sao.** Hiện tạm đặt trong “Chi phí phát sinh”, **chưa thể khẳng định là tiêu dùng thực tế**. Nếu là trả nợ / mượn tiền / chuyển hộ / hoàn tiền / ăn uống / di chuyển, hãy ghi rõ:
| ID | Ngày | Tiền ra | Thông tin đang có | Bạn sửa mô tả đúng và chọn lại (chỉ một trong 3 danh mục nếu là chi tiêu) |
| --- | --- | ---: | --- | --- |
| 04 | 2026-09-23 | 10.000đ | Chuyển 10.000đ cho Nguyễn Lê Bình Minh để làm gì? | `Mục đích: cũng đéo nhớ nữa thôi cứ tính mẹ vô tiền ăn đi. ; Danh mục: ... ; Bản chất: ...` |
| 17 | 2026-09-27 | 29.000đ | Chuyển 29.000đ cho Lê Văn Tuấn để làm gì? Thông báo là 27/09 23:01; bảng tra soát ghi 28/09. | `Mục đích: đi uống cafe với đám bạn ; Danh mục: ăn uống ; Bản chất: ...` |
| 25 | 2026-10-01 | 19.600đ | Thanh toán QR 19.600đ là mua món/dịch vụ gì, ở đâu? | `Mục đích: cũng đéo nhớ luôn. ; Danh mục: ... ; Bản chất: ...` |
| 34 | 2026-10-02 | 250.000đ | Chuyển 250.000đ cho Trần Thị Kim Diệu để làm gì? | `Mục đích: tiền sửa xe máy ; Danh mục: cho vào chi phí phát sinh đi. ; Bản chất: ...` |
| 36 | 2026-10-03 | 44.000đ | Chuyển 44.000đ cho Đỗ Ngọc Hữu để làm gì? | `Mục đích: ăn uống ; Danh mục: ... ; Bản chất: ...` |
| 43 | 2026-10-07 | 45.000đ | Chuyển 45.000đ cho Võ Chánh Tín để làm gì? | `Mục đích: tiền ăn cơm gà ; Danh mục: ăn uống ; Bản chất: ...` |
| 48 | 2026-10-09 | 10.000đ | Chuyển 10.000đ cho Nguyễn Trọng Bình để làm gì? | `Mục đích: cho vào ăn uống đi, tại cũng đéo nhớ nữa. ; Danh mục: ... ; Bản chất: ...` |
| 52 | 2026-10-10 | 25.000đ | Chuyển 25.000đ cho Nguyễn Hoàng Phúc để làm gì? | `Mục đích: ăn uống ; Danh mục: ăn uống; Bản chất: ...` |
| 65 | 2026-10-21 | 103.000đ | Chuyển 103.000đ cho Nguyễn Quang Tùng ngày 21/10 để làm gì? | `Mục đích: chuyển tiền ăn uống 3 bữa trong 1 lần luôn ; Danh mục: ăn uống ; Bản chất: ...` |

**Một số câu hỏi khác ảnh hưởng trực tiếp tới báo cáo sau này:**

1. **ATM 08/10 −403.300đ (ID 46):** bạn rút được bao nhiêu tiền mặt? Có phí không? Tiền mặt đã dùng để mua những gì hay vẫn còn giữ?

- Trả lời: 400k tiền mặt, đa phần chi trả vào đổ xăng đi lại, 1 phần nhỏ chi trả các khoản lặt vặt khác.

2. **Workafe 04/10 −35.000đ (ID 39):** thực tế là uống cà phê/đồ uống hay dịch vụ khác?

- Trả lời: tiền đi ra cà phê ngồi làm việc, tính vào chi phí phát sinh đi.

3. **Bách Hóa Xanh 06/10 −25.000đ (ID 41):** mua thực phẩm/đồ uống hay đồ dùng khác?

- Trả lời: tính vào chi phí phát sinh luôn.

4. **Hai khoản thanh toán thẻ Google / YouTube:** 26/09 −54.444đ và 15/10 −21.111đ; bạn có thấy thu thêm 9.900đ mỗi lần (phí, VAT hoặc bút toán riêng) trên sao kê VCB không?

- Trả lời: tính vào chi phí phát sinh luôn đi, tôi hủy luôn cái gia hạn youtube premium rồi.

5. **Các khoản nạp MoMo:** bạn có bảng giao dịch ví MoMo để phân loại **chi tiêu thực sự bằng MoMo** không? Nếu có, gửi riêng để tránh gộp nhầm tiền nạp ví thành tiền ăn uống.

- Trả lời: chỉ là chuyển qua chuyển lại để gom tiền lại 1 tài khoản, cứ lấy số dư cuối cùng tại thời điểm đó làm mốc hoặc ghi nhận thêm giao dịch cộng/trừ cho đúng với số dư thực tế.

6. **Khoản chuyển 2.150.000đ ngày 01/10 (ID 27):** vẫn muốn _không đưa vào bất kỳ ngân sách hoặc báo cáo chi tiêu nào_ (nhưng vẫn trừ số dư VCB), đúng không?

- Trả lời: xem như không có khoản này luôn, xem như không tồn tại, và số dư chỉ tính qua việc trừ đi khoản này tại lúc đó. ví dụ lúc đó có 3 triệu thì thực tế chi tính lúc đó có 850k thôi, và không ghi nhận giao dịch này, hiểu ý tôi chứ?

7. **Tiền xe và tiền mặt 15.000đ:** xác nhận chi tiết ở B2; nếu 15.000đ thực ra là tiền Grab riêng, hãy sửa lại ở B2.

- Trả lời: 15k đó thực chất là được trả qua tiền mặt luôn đó, trả tiền grab qua tiền mặt luôn đó, (cái khoản mà 250k + 235k + 500k thì nếu bạn nhận ra sẽ tương đương với 2 khoản chuyển 500k x2 lần như vậy đó).

8. **Lương ACB:** ngày nhận 4.544.800đ thực tế là ngày nào và có bị trừ/hoàn thêm khoản nào sau phiếu lương không?

- Trả lời: ngày nhận thực tế là ngày 30/9, đúng là 4544800 đó. tuy nhiên do tài khoản ACB còn thêm tiền thừa nên tôi cộng dồn chuyển qua nốt á nên mới thấy số tiền hơn 4 triệu 800.

9. **Số dư đầu kỳ và khoản tiền mặt sẵn có:** bạn muốn phân tích toàn bộ tài sản (VCB + ACB + MoMo + tiền mặt) hay chỉ riêng VCB? Các giao dịch chỉ trên VCB không đủ lập báo cáo toàn bộ tài sản.

- Trả lời: số dư hoặc khoản còn lại, hay khoản chênh lêch trên web phải phản ánh thực tế số tiền còn lại đúng của tôi, tính bao gồm cả tiền mặt lẫn tiền trong tài khoản.
- lưu ý: chỉ riêng cái khoản −562.298 là tiền tôi chi trả tiền điện cho nhà (ở quê) cho mẹ đỡ tiền, kiểu như là tặng mẹ tôi luôn á, nên khoản này kiểu như là chi phí phát sinh đi.

## E. Dữ liệu đối soát kỹ thuật (mã nguồn từng giao dịch)

Bảng này dành cho lần xử lý sau. **Không cần điền**, trừ khi bạn phát hiện một mã/trật tự thời gian sai. Các mã đầy đủ tại đây giúp đối chiếu khi bạn gửi lại file.
| ID | Mã truy vết / tham chiếu trong ảnh | Nguồn phát hiện |
| --- | --- | --- |
| 01 | `EW26092133604295` | Mới: ảnh |
| 02 | `MBVCB.16175697385` | Đã có bộ 39 |
| 03 | `MBVCB.16190213887` | Đã có bộ 39 |
| 04 | `MBVCB.16190326282` | Đã có bộ 39 |
| 05 | `MBVCB.16191108694` | Đã có bộ 39 |
| 06 | `MBVCB.16201578823` | Đã có bộ 39 |
| 07 | `EW26092446135960` | Mới: ảnh |
| 08 | `EW26092446507594` | Mới: ảnh |
| 09 | `EW26092550607236` | Mới: ảnh |
| 10 | `EW26092553039326` | Mới: ảnh |
| 11 | `EW26092654655436` | Mới: ảnh |
| 12 | `EW26092655630453` | Mới: ảnh |
| 13 | `CARD-YOUTUBE-20260926` | Mới: ảnh |
| 14 | `EW26092656758092` | Mới: ảnh |
| 15 | `EW26092760434100` | Mới: ảnh |
| 16 | `EW26092760649199` | Mới: ảnh |
| 17 | `MBVCB.16260894172` | Đã có bộ 39; lệch ngày |
| 18 | `EW26092967945239` | Mới: ảnh |
| 19 | `MBVCB.16299169675` | Đã có bộ 39 |
| 20 | `EW26100175794511` | Mới: ảnh |
| 21 | `EW26100175801422` | Đã có bộ 39 |
| 22 | `EW26100175810597` | Mới: ảnh |
| 23 | `EW26100175828156` | Đã có bộ 39 |
| 24 | `EW26100175834770` | Mới: ảnh |
| 25 | `MBVCB.16315561558` | Đã có bộ 39 |
| 26 | `BB-011026-16:29:51` | Đã có bộ 39 |
| 27 | `MBVCB.16316497930` | Đã có bộ 39 |
| 28 | `EW26100178427781` | Mới: ảnh |
| 29 | `EW26100179169776` | Mới: ảnh |
| 30 | `EW26100179228623` | Đã có bộ 39 |
| 31 | `EW26100179246814` | Mới: ảnh |
| 32 | `EW26100179598190` | Mới: ảnh |
| 33 | `MBVCB.16325390758` | Đã có bộ 39 |
| 34 | `MBVCB.16325745300` | Đã có bộ 39 |
| 35 | `MBVCB.16329912252` | Đã có bộ 39 |
| 36 | `MBVCB.16341691953` | Đã có bộ 39 |
| 37 | `EW26100388114098` | Mới: ảnh |
| 38 | `EW26100388169570` | Mới: ảnh |
| 39 | `MBVCB.16361638763` | Đã có bộ 39 |
| 40 | `MBVCB.16393372483` | Đã có bộ 39 |
| 41 | `MBVCB.16401588456` | Đã có bộ 39 |
| 42 | `EW26100706746968` | Mới: ảnh |
| 43 | `MBVCB.16410015906` | Đã có bộ 39 |
| 44 | `EW26100706899409` | Mới: ảnh |
| 45 | `MBVCB.16414962521` | Đã có bộ 39 |
| 46 | `ATM_CWD.94600006` | Mới: ảnh |
| 47 | `MBVCB.16448172251` | Đã có bộ 39 |
| 48 | `MBVCB.16449379953` | Đã có bộ 39 |
| 49 | `VCB-MY-HUONG-09OCT` | Đã có bộ 39 |
| 50 | `MBVCB.16452917158` | Đã có bộ 39 |
| 51 | `VCB-LE-THI-PHUOC-TAM-09OCT` | Đã có bộ 39 |
| 52 | `MBVCB.16461798028` | Đã có bộ 39 |
| 53 | `MBVCB.16494985699` | Đã có bộ 39 |
| 54 | `MBVCB.16512448299` | Đã có bộ 39 |
| 55 | `MBVCB.16528678424` | Đã có bộ 39 |
| 56 | `CARD-GOOGLEONE-20261015` | Mới: ảnh |
| 57 | `MBVCB.16554669761` | Đã có bộ 39 |
| 58 | `MBVCB.16566824296` | Đã có bộ 39 |
| 59 | `MBVCB.16589193695` | Đã có bộ 39 |
| 60 | `MBVCB.16596558210` | Đã có bộ 39 |
| 61 | `MBVCB.16598750792` | Đã có bộ 39 |
| 62 | `MBVCB.16603683911` | Đã có bộ 39 |
| 63 | `MBVCB.16637375031` | Đã có bộ 39 |
| 64 | `MBVCB.16637554241` | Đã có bộ 39 |
| 65 | `MBVCB.16653692122` | Mới: ảnh |

## F. Mốc số dư để phát hiện thiếu giao dịch (KHÔNG phải tính chi tiêu)

| Đối soát ngân hàng                                                       |         VND |
| ------------------------------------------------------------------------ | ----------: |
| Số dư VCB sau giao dịch 20/09/2026 (mốc trước kỳ)                        |   3.110.889 |
| Tiền **vào** VCB quan sát được trong 65 dòng                             |  +6.086.000 |
| Tiền **ra** VCB quan sát được trong 65 dòng                              |  −8.358.612 |
| Chênh chưa xác minh 25–26/09 (suy từ các mốc số dư)                      |         +87 |
| Chênh cạnh giao dịch YouTube 26/09 (suy ra, **chưa xác nhận** là phí)    |      −9.900 |
| Chênh cạnh giao dịch Google One 15/10 (suy ra, **chưa xác nhận** là phí) |      −9.900 |
| **Số dư VCB khớp với ảnh 21/10/2026 19:58:28**                           | **818.564** |

**Quan trọng:** 3 chênh (+87, −9.900, −9.900) là phần **chênh suy luận**, **không được tự thêm thành 3 giao dịch thật trong CSV** trước khi có sao kê. Mục đích là khớp các mốc số dư, không chứng minh đã phát sinh phí.

**Các khoản ngoài phạm vi 65 dòng:** ảnh có hiện giao dịch trước kỳ ngày 20/09; chỉ số dư 3.110.889đ được dùng làm số dư đầu kỳ cho chuỗi 21/09–21/10. Không trộn giao dịch trước kỳ vào sổ này để tránh đếm lại. Nếu bạn muốn mở rộng sổ trước 21/09, cần bổ sung sao kê giai đoạn đó.
