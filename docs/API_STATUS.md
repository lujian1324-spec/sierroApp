# PowerFlow App - API 对接状态文档

> 最后更新：2026-06-02  
> 基础 URL: `https://solar.siseli.com/apis`

---

## ✅ 已对接（UI 正在使用）

| 分类 | 方法 | API 路径 | 函数名 | 使用位置 | 状态 |
|---|---|---|---|---|---|
| 认证 | POST | `/login/account` | `loginByAccount` | `authStore.login` | ✅ |
| 认证 | POST | `/login/logout` | `logout` | `authStore.logout` | ✅ |
| 认证 | POST | `/login/refresh/access/token` | `refreshAccessToken` | `apiClient` 自动刷新 | ✅ |
| 认证 | POST | `/user/register/email` | `registerByEmail` | `RegisterPage` | ✅ |
| 认证 | POST | `/user/send/email/captcha` | `sendEmailCaptcha` | `RegisterPage` | ✅ |
| 认证 | POST | `/user/select/iotUserInfo` | `fetchUserInfo` | `authStore.restoreSession` | ✅ |
| 设备 | POST | `/device/list` | `fetchDeviceList` | `deviceStore.loadDevices` | ✅ |
| 设备 | GET | `/device/details` | `fetchDeviceDetails` | `deviceStore.loadDeviceDetails` | ✅ |
| 设备 | POST | `/device/delete` | `deleteDevice` | `deviceStore.removeDevice` | ✅ |
| 设备 | POST | `/device/update` | `updateDevice` | `deviceStore.updateDeviceInfo` | ✅ |
| 设备 | POST | `/device/pin` | `pinDevice` | `deviceStore.togglePin` | ✅ |
| 设备 | POST | `/device/unpin` | `unpinDevice` | `deviceStore.togglePin` | ✅ |
| 设备 | GET | `/remote/device/state/latest` | `fetchDeviceState` | `deviceStore.loadDeviceState` | ✅ |
| 设备 | POST | `/remote/device/config/write` | `writeDeviceConfig` | `deviceStore.controlDevice` | ✅ |
| 设备 | POST | `/alarm/query/list` | `fetchAlarms` | `deviceStore.loadAlarms` | ✅ |
| 设备 | POST | `/alarm/update/isProcessed` | `ignoreAlarm` | `deviceStore.dismissAlarm` | ✅ |
| 削峰填谷 | GET | `/peakValley/device/get` | `fetchPeakValleyConfig` | `deviceStore.loadPeakValley` | ✅ |
| 削峰填谷 | POST | `/peakValley/device/enable` | `setPeakValleyEnabled` | `deviceStore.enablePeakValley` | ✅ |
| 削峰填谷 | POST | `/peakValley/device/general/set` | `setPeakValleyGeneral` | `deviceStore.savePeakValleyGeneral` | ✅ |
| 电站 | POST | `/station/list` | `fetchStationList` | `deviceStore.loadStations` | ✅ |
| 电站 | POST | `/station/add` | `addStation` | `deviceStore.createStation` | ✅ |
| 能量流 | GET | `/deviceState/simple/energy/flow/v1` | `fetchSimpleEnergyFlow` | `deviceStore.loadEnergyFlow` | ✅ |

---

## ⚠️ 已定义函数但 UI 未调用

### 🔐 认证相关（5个）

| 方法 | API 路径 | 函数名 | 优先级 | 建议 |
|---|---|---|---|---|
| POST | `/login/email` | `loginByEmail` | 🔴 高 | 邮箱验证码登录，需补充 UI |
| POST | `/login/sms` | `loginBySms` | 🔴 高 | 短信登录，需补充 UI |
| POST | `/user/register/cellphone` | `registerByCellphone` | 🟡 中 | 手机号注册，已移除 UI |
| POST | `/user/send/sms/captcha` | `sendSmsCaptcha` | 🟡 中 | 短信验证码，配合登录使用 |
| POST | `/user/update/authPassword` | `updatePassword` | 🔴 高 | **修改密码，用户常见功能** |
| POST | `/user/reset/password` | `resetPassword` | 🔴 高 | **忘记密码，用户常见功能** |
| GET | `/user/account/check` | `checkAccountExists` | 🟢 低 | 账号重名检查，注册页可调用 |
| GET | `/user/email/check` | `checkEmailExists` | 🟢 低 | 邮箱重名检查，注册页可调用 |
| POST | `/user/update/iotUserInfo` | `updateUserInfo` | 🟡 中 | 修改用户信息，SettingPage 可对接 |
| POST | `/user/logout/account` | `deleteAccount` | 🟡 中 | 注销账户，危险操作需确认 |

**建议优先实现：**
1. **忘记密码** (`/user/reset/password`) - 用户常见需求
2. **修改密码** (`/user/update/authPassword`) - 账户安全
3. **邮箱/短信验证码登录** - 提供多种登录方式

---

### 📱 设备相关（8个）

| 方法 | API 路径 | 函数名 | 优先级 | 建议 |
|---|---|---|---|---|
| POST | `/device/add/single` | `addDevice` | 🔴 高 | **添加设备，核心功能** |
| POST | `/device/add/single/addStationTogether` | `addDeviceWithStation` | 🔴 高 | 添加设备并创建电站 |
| GET | `/device/dtu/info` | `fetchDtuInfo` | 🟢 低 | DTU 信息查询 |
| GET | `/device/query/attribute/group` | `fetchDeviceAttributeGroups` | 🟡 中 | 属性分组展示 |
| GET | `/remote/device/energy/flow` | `fetchDeviceEnergyFlow` | 🟢 低 | 旧能量流，已被 v1 替代 |
| POST | `/remote/device/config/read` | `readDeviceConfig` | 🟡 中 | 读取单个配置参数 |
| POST | `/remote/device/configs/read` | `readDeviceConfigs` | 🟡 中 | 批量读取配置参数 |
| POST | `/remote/device/configs/cache/get` | `getDeviceConfigCache` | 🟢 低 | 配置缓存读取 |
| POST | `/remote/device/state/report/fast/start` | `startFastReport` | 🟡 中 | 快速上报，实时监控 |
| POST | `/remote/device/state/report/fast/stop` | `stopFastReport` | 🟡 中 | 停止快速上报 |
| GET | `/remote/device/state/report/fast/supported` | `checkFastReportSupported` | 🟢 低 | 检查是否支持快速上报 |

**建议优先实现：**
1. **添加设备** (`/device/add/single`) - 核心流程，目前缺失
2. **快速上报** - 提升实时监控体验

---

### 📊 设备状态与历史数据（4个）

| 方法 | API 路径 | 函数名 | 优先级 | 建议 |
|---|---|---|---|---|
| POST | `/deviceState/attribute/keys/history` | `fetchHistoryData` | 🔴 高 | **历史数据，StatsPage 核心功能** |
| POST | `/alarm/getLatestAlarm` | `fetchLatestAlarm` | 🟡 中 | 最新告警，首页可展示 |
| POST | `/alarm/delete/alarm` | `deleteAlarm` | 🟢 低 | 删除告警（非忽略） |
| GET | `/deviceState/simple/state/latest/v1` | `fetchSimpleState` | 🟢 低 | 简化状态，目前直接用 `fetchDeviceState` |

**建议优先实现：**
1. **历史数据** (`/deviceState/attribute/keys/history`) - StatsPage 当前是 Mock 数据，需对接真实 API

---

### ⚡ 削峰填谷（5个）

| 方法 | API 路径 | 函数名 | 优先级 | 建议 |
|---|---|---|---|---|
| GET | `/peakValley/device/attribute/group` | `fetchPeakValleyAttributeGroup` | 🟡 中 | 属性分组 |
| GET | `/peakValley/device/general/get` | `fetchPeakValleyGeneral` | 🟢 低 | 已被 `fetchPeakValleyConfig` 替代 |
| POST | `/peakValley/device/customized/set` | `setPeakValleyCustomized` | 🟡 中 | **自定义模式，SmartSchedulePage 可对接** |
| GET | `/peakValley/types/device` | `fetchPeakValleyTypes` | 🟢 低 | 类型查询 |
| GET | `/peakValley/types/all` | `fetchAllPeakValleyTypes` | 🟢 低 | 全部类型 |

**建议优先实现：**
1. **自定义模式** (`/peakValley/device/customized/set`) - 智能调度高级功能

---

### 🏭 电站相关（4个）

| 方法 | API 路径 | 函数名 | 优先级 | 建议 |
|---|---|---|---|---|
| GET | `/station/details` | `fetchStationDetails` | 🟡 中 | 电站详情 |
| POST | `/station/update` | `updateStation` | 🟡 中 | 更新电站信息 |
| POST | `/station/delete` | `deleteStation` | 🟡 中 | 删除电站 |
| GET | `/station/energy/flow` | `fetchStationEnergyFlow` | 🟡 中 | 电站能量流 |

---

### 🎛️ 应用模式（2个）

| 方法 | API 路径 | 函数名 | 优先级 | 建议 |
|---|---|---|---|---|
| GET | `/deviceApplyMode/modes/main` | `fetchMainApplyModes` | 🟡 中 | 主应用模式 |
| GET | `/deviceApplyMode/modes/external` | `fetchExternalApplyModes` | 🟡 中 | 外挂模式 |

---

## 📋 实现优先级建议

### 🔴 P0 - 核心功能缺失（必须实现）

1. **历史数据对接** - StatsPage 当前使用 Mock 数据
   - API: `POST /deviceState/attribute/keys/history`
   - 函数: `fetchHistoryData`
   - 位置: `StatsPage.tsx`

2. **添加设备流程** - 目前无法添加真实设备
   - API: `POST /device/add/single`
   - 函数: `addDevice`
   - 位置: `ProvisioningPage.tsx` 或新增页面

3. **忘记密码** - 用户常见需求
   - API: `POST /user/reset/password`
   - 函数: `resetPassword`
   - 位置: LoginPage 新增"忘记密码"入口

4. **修改密码** - 账户安全
   - API: `POST /user/update/authPassword`
   - 函数: `updatePassword`
   - 位置: SettingPage

---

### 🟡 P1 - 重要功能（建议实现）

1. **邮箱/短信验证码登录** - 提供多种登录方式
   - API: `POST /login/email`, `POST /login/sms`
   - 函数: `loginByEmail`, `loginBySms`

2. **快速上报** - 提升实时监控体验
   - API: `POST /remote/device/state/report/fast/start`
   - 函数: `startFastReport`

3. **削峰填谷自定义模式** - 智能调度高级功能
   - API: `POST /peakValley/device/customized/set`
   - 函数: `setPeakValleyCustomized`

4. **用户信息编辑** - 完善账户管理
   - API: `POST /user/update/iotUserInfo`
   - 函数: `updateUserInfo`
   - 位置: SettingPage

---

### 🟢 P2 - 增强功能（可选实现）

1. 账号/邮箱重名检查 - 提升注册体验
2. DTU 信息查询 - 专业用户功能
3. 电站详情/更新/删除 - 多电站管理
4. 应用模式查询 - 高级功能

---

## 📊 统计

| 状态 | 数量 | 占比 |
|---|---|---|
| ✅ 已对接（UI 正在使用） | 22 | 37% |
| ⚠️ 已定义但未调用 | 37 | 63% |
| **总计** | **59** | **100%** |

---

## 🛠️ 下一步行动

建议按以下顺序推进：

1. **本周**：对接历史数据 API（StatsPage）
2. **下周**：实现添加设备流程
3. **下下周**：实现忘记密码和修改密码
4. **后续**：逐步补齐 P1 和 P2 功能

---

_此文档会自动更新，每次对接新接口后请同步修改此文件。_
