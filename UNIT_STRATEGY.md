# CSS 單位策略規格

> 版本：v1.0　最後更新：2026-04
>
> 本規格為 ClampTypeTool 平台的配套文件。
> 規格資料的 TypeScript 來源在 `src/data/unitStrategy.ts`，
> 型別定義在 `src/types/index.ts`（`UnitStrategy`、`UnitStrategyCategory`）。

---

## 規格總覽

CSS 屬性的單位選擇不是隨意的，應依屬性的語意角色決定。
本規格把所有常用屬性分為三大類，每類對應一套單位策略。

| 分類 | 關鍵字 | 核心單位 | 邏輯 |
|------|--------|----------|------|
| Typography-relative | 文字節奏、內部留白 | `rem`、`clamp()` | 跟隨使用者字級縮放 |
| Layout-relative | 版面寬度、大型間距 | `rem`、`%`、`clamp()`、`min()` | 兼顧閱讀寬度與 viewport |
| Visual-fixed | 線條、小型圓角 | `px` | 不應隨字級變化 |

---

## 一、Typography-relative

**定義：** 這類屬性與文字節奏、內容閱讀、元件內部留白有關。
當使用者在瀏覽器中調整字級設定，這些屬性應同步縮放，確保排版比例不被破壞。

**建議單位：** `rem`（首選）、`clamp()`（響應式時）

**不建議：** `px`（無視使用者字級偏好，違反 WCAG 1.4.4）、`em`（巢狀複合縮放，難以維護）

### font-size

| 項目 | 內容 |
|------|------|
| 建議單位 | `rem` |
| 可接受 | `rem`、`clamp()` |
| 避免 | `px`、`em` |
| 理由 | `rem` 跟隨 root 字級，確保 accessibility。`px` 無視使用者設定。 |
| 補充 | 做響應式時輸出 `clamp()`，但 min/max 值仍建議用 `rem`，確保放大時上下限同步調整。 |

```css
/* 靜態 */
font-size: 1rem;
font-size: 1.25rem;

/* 響應式 */
font-size: clamp(1rem, 0.875rem + 0.5vw, 1.5rem);
font-size: clamp(1rem, calc(0.9rem + 1vw), 1.25rem);
```

---

### padding

| 項目 | 內容 |
|------|------|
| 建議單位 | `rem` |
| 可接受 | `rem`、`clamp()`、`%` |
| 避免 | `px` |
| 理由 | `rem` 讓內部留白隨字級保持比例，維持閱讀節奏的一致性。 |
| 補充 | 元件內部（button、input）優先 `rem`；大型 section 的 padding-block 可用 `clamp()`。 |

```css
/* 元件內部 */
padding: 1rem;
padding: 0.75rem 1.25rem;

/* 大型 section */
padding-block: clamp(2.5rem, 1rem + 4vw, 7rem);
padding-inline: clamp(1rem, 3vw, 3rem);
```

---

### margin

| 項目 | 內容 |
|------|------|
| 建議單位 | `rem` |
| 可接受 | `rem`、`clamp()`、`auto` |
| 避免 | `px` |
| 理由 | `rem` 維持排版節奏；`margin: auto` 用於置中不受此規則限制。 |
| 補充 | 大型區塊間距可搭配 `clamp()`。`margin-block` 比 `margin-inline` 更適合用 `clamp()`。 |

```css
margin-bottom: 1rem;
margin-block: clamp(2rem, 1rem + 3vw, 5rem);
margin-inline: auto; /* 置中，不受規則限制 */
```

---

### gap

| 項目 | 內容 |
|------|------|
| 建議單位 | `rem` |
| 可接受 | `rem`、`clamp()` |
| 避免 | `px` |
| 理由 | `rem` 讓 flex/grid 間距隨字級縮放，維持內容節奏。 |
| 補充 | 小型 UI 的 gap（icon + label）可視情況用 `px` 取得精確控制；大型 grid gap 可用 `clamp()`。 |

```css
gap: 1rem;
gap: 0.5rem 1rem;
gap: clamp(1.5rem, 1rem + 2vw, 4rem);
```

---

## 二、Layout-relative

**定義：** 這類屬性與版面寬度、大型區塊節奏、容器行為有關。
要兼顧閱讀寬度與 viewport 變化，不能只用單一固定值。

**建議單位：** `rem`、`%`、`clamp()`、`min()` / `max()`

**不建議：** 固定 `px`（無法隨 viewport 調整）

### max-width

| 項目 | 內容 |
|------|------|
| 建議單位 | `rem`、`%` |
| 可接受 | `rem`、`%`、`min()`、`clamp()` |
| 避免 | 固定 `px` |
| 理由 | `rem` 讓閱讀寬度與字級保持比例（中文約 35–45 字、英文約 60–75 字/行）。`%` 讓容器在小螢幕保有彈性。 |
| 補充 | 最推薦寫法：`min(100% - 2rem, 75rem)`，同時兼顧最大寬度與行動版邊距，可取代 `max-width + padding-inline` 組合。 |

```css
/* 單純最大寬度 */
max-width: 75rem;

/* 推薦：同時處理邊距 */
width: min(100% - 2rem, 75rem);
width: min(100% - 3rem, 90rem);

/* 進階：動態邊距 */
width: min(100% - clamp(2rem, 5vw, 6rem), 80rem);
```

---

### section / hero spacing

| 項目 | 內容 |
|------|------|
| 建議單位 | `clamp()` |
| 可接受 | `clamp()`、`rem`、`%` |
| 避免 | `px` |
| 理由 | 大型版面間距需要在手機與桌面之間流暢縮放，`clamp()` 直接定義最小/最大留白。 |
| 補充 | 適用：section padding-block、hero 區塊間距、large block gap、feature grid 間距。行動版最小值約 2–3rem，桌面最大值約 5–10rem。 |

```css
/* Section 垂直留白 */
padding-block: clamp(2.5rem, 1rem + 4vw, 7rem);

/* Hero 大型間距 */
padding-block: clamp(3rem, 2rem + 5vw, 10rem);

/* Large block margin */
margin-block: clamp(4rem, 2rem + 6vw, 12rem);
```

---

## 三、Visual-fixed

**定義：** 這類屬性主要是純視覺細節，不應隨文字縮放或 viewport 變化。

**建議單位：** `px`

**不建議：** `rem`、`em`（縮放後視覺細節會失去一致性）

### border-width

| 項目 | 內容 |
|------|------|
| 建議單位 | `px` |
| 可接受 | `px` |
| 避免 | `rem`、`em`、`%` |
| 理由 | 線條是純視覺細節，不應隨字級縮放。`1px` hairline 若用 `rem`，字級放大時會變成 1.5–2px，破壞設計語言。 |
| 補充 | hairline/divider 固定 `1px`；強調邊框（focus ring）可用 `2px`。`outline` 與 `box-shadow` spread 也適用同規則。 |

```css
border: 1px solid var(--color-border);
border-width: 2px;
outline: 2px solid var(--color-focus);
outline-offset: 2px;
box-shadow: 0 0 0 1px var(--color-border);
```

---

### border-radius

`border-radius` 不能一刀切，依元件大小分兩種策略：

#### 小型元件（button、input、badge、tag、small card）

| 項目 | 內容 |
|------|------|
| 建議單位 | `px` |
| 可接受 | `px` |
| 避免 | `rem`、`em`、`%` |
| 理由 | 小型元件的圓角是設計系統視覺語言的一部分，固定 `px` 確保一致性。`rem` 會讓字級放大時 button 過圓。 |
| 補充 | 建議設計 token 範圍：`4px`（緊湊）、`6px`（預設）、`8px`（柔和）。 |

```css
/* 按鈕、輸入框 */
border-radius: 6px;

/* badge、tag */
border-radius: 4px;

/* 稍柔和的 card */
border-radius: 8px;
```

#### 大型容器（modal、dialog、large card、bottom sheet）

| 項目 | 內容 |
|------|------|
| 建議單位 | `rem` |
| 可接受 | `rem`、`px` |
| 避免 | `%`（50% 或極大值除外） |
| 理由 | 大型容器的圓角可稍微隨字級彈性調整，`rem` 讓視覺比例更自然。 |
| 補充 | 設計系統以 `px` 為主也可接受，端看 token 策略。避免 `9999px` 除非刻意做藥丸形（pill）。 |

```css
/* Modal、dialog */
border-radius: 1.5rem;

/* Large card、panel */
border-radius: 1rem;

/* Bottom sheet */
border-radius: 2rem 2rem 0 0;
```

---

## 屬性對照表

| 屬性 | 分類 | 建議單位 | 理由摘要 | 補充 |
|------|------|----------|----------|------|
| `font-size` | Typography-relative | `rem` | 跟隨使用者字級偏好，符合 a11y | 響應式時可輸出 `clamp()`，min/max 仍用 `rem` |
| `padding` | Typography-relative | `rem` | 留白隨字級保持比例 | 大型 section 可用 `clamp()` |
| `margin` | Typography-relative | `rem` | 維持排版節奏 | `auto` 不受限制；大型 block 可 `clamp()` |
| `gap` | Typography-relative | `rem` | 間距隨字級縮放 | 小型 UI gap 可酌情用 `px` |
| `max-width` | Layout-relative | `rem` + `%` | 閱讀寬度比例 + 小螢幕彈性 | 推薦 `min(100% - 2rem, 75rem)` |
| section spacing | Layout-relative | `clamp()` | 版面間距需 viewport 響應 | 適用 section/hero padding-block |
| `border-width` | Visual-fixed | `px` | 純視覺細節不應縮放 | hairline `1px`，focus ring `2px` |
| `border-radius`（小） | Visual-fixed | `px` | 維持視覺語言一致性 | button/input/badge：4–8px |
| `border-radius`（大） | Visual-fixed | `rem` | 大型容器比例較自然 | modal/card：1–2rem |

---

## 常見問題

**Q：px 一律不能用嗎？**
A：不是。Visual-fixed 類（border-width、小型 border-radius）就應該用 `px`。
規則是「依屬性語意選單位」，不是「全部換成 rem」。

**Q：clamp() 的 min/max 值可以用 px 嗎？**
A：技術上可以，但不建議。若用 px 作為 clamp 邊界，使用者放大字級時字體達到邊界後不再跟隨，
違反 a11y 精神。建議 min/max 都用 rem，確保邊界也能縮放。

**Q：設計稿給的是 px，要怎麼換算？**
A：以 root 字級 16px 為基準，除以 16 得 rem 值。
例：`24px ÷ 16 = 1.5rem`，`20px ÷ 16 = 1.25rem`。
ClampTypeTool 的 Two-point mode 輸出的 clamp() 使用 px，
可視設計系統需求決定是否手動轉換為 rem-based clamp。

**Q：border-radius 用 `50%` 怎麼算？**
A：`50%` 是針對正圓或橢圓（如頭像）的特例，不受此規格限制。
一般元件圓角不建議用百分比。

---

## 與 ClampTypeTool 的關係

本規格目前為平台的「配套規格」，尚未整合進工具的即時提示 UI。
程式碼層面的連結：

- 型別：`src/types/index.ts` — `UnitStrategy`、`UnitStrategyCategory`、`PROPERTY_TYPE_CATEGORY`
- 資料：`src/data/unitStrategy.ts` — `UNIT_STRATEGIES`、lookup helpers
- 工具現有的 `PropertyType`（`font-size`、`margin-top` 等）均已透過 `PROPERTY_TYPE_CATEGORY` 對應到 `typography-relative`

未來可延伸的方向：
- FormPanel 選擇 propertyType 時，右側顯示對應的單位策略提示
- 新增 `border-width`、`border-radius`、`max-width` 到工具的 PropertyType，套用對應策略
- Inspector 面板直接顯示「建議單位」與「避免單位」
