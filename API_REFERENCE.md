# Sierro PowerFlow App — API Reference

> Base URL: `https://solar.siseli.com/openapis`  
> Auth: IoT-Open 签名（AppID: rYGQpmYU5k / AppSecret: GhJXQYEHphHlyiqYnBGE）  
> Content-Type: `application/json`  
> 文档来源: http://doc.solar.siseli.com/openapi/#/

---

## 通用响应格式

```json
{
  "code": 0,
  "message": "string",
  "localMessage": "string",
  "data": {}
}
```
`code === 0` 表示成功，其他为错误码。

---

## 一、用户登录服务 User Login Service

### POST `/login/account` — 账号密码登录

**Request Body:**
```json
{
  "account": "string",
  "password": "string"
}
```

**Response 200:**
```json
{
  "code": 0,
  "data": {
    "accessToken": "string",
    "accessTokenWillExpiredAt": "2026-05-10T00:00:00Z",
    "accessTokenWillExpiredInMillis": 0,
    "refreshToken": "string",
    "refreshTokenWillExpiredAt": "2026-05-10T00:00:00Z",
    "refreshTokenWillExpiredInMillis": 0,
    "account": "string",
    "authId": 0,
    "userId": 0,
    "userType": 0,
    "isAdmin": true,
    "isDealer": true,
    "isIntegrator": true,
    "isStationOwner": true,
    "ticket": "string",
    "themeColor": "string"
  },
  "message": "string"
}
```

### POST `/login/logout` — 退出登录
> 需要 Authorization header

### POST `/login/refresh/access/token` — 刷新 Token

### POST `/login/email` — 邮箱验证码登录
### POST `/login/sms` — 手机短信验证码登录

---

## 二、设备管理服务 Device Service

### POST `/device/list` — 查询设备列表（searchDevicesUsingPOST）

**Request Body:**（分页查询）
```json
{
  "pageNumber": 1,
  "pageSize": 20,
  "stationId": 0,
  "keyword": "string"
}
```

**Response data:**
```json
{
  "total": 0,
  "list": [
    {
      "id": 0,
      "name": "string",
      "serialNumber": "string",
      "deviceSortKey": "string",
      "gatherProtocolNumber": "string",
      "stationId": 0,
      "stationName": "string",
      "isPinned": true
    }
  ]
}
```

### GET `/device/details` — 获取设备详情（getDeviceDetailsUsingGET）

**Query Params:**
- `deviceId` *required (integer)

### POST `/device/add/single` — 添加单个设备
### POST `/device/delete` — 删除设备
### POST `/device/update` — 编辑设备信息
### POST `/device/pin` — 置顶设备
### POST `/device/unpin` — 取消置顶

### GET `/device/dtu/info` — 获取设备采集器信息
**Query Params:** `deviceId`

### POST `/device/external/list` — 获取外挂设备列表

---

## 三、设备状态服务 Device State Service

### POST `/device/state/page` — 获取设备状态明细数据（getDeviceAttributeStatePageUsingPOST）

**Request Body:**
```json
{
  "deviceId": 0,
  "startTime": "2026-05-01T00:00:00Z",
  "endTime": "2026-05-10T00:00:00Z",
  "pageNumber": 1,
  "pageSize": 100,
  "attributeKeys": ["string"]
}
```

### POST `/device/state/page/v2` — 获取设备状态明细数据 V2
### POST `/device/state/page/v3` — 获取设备状态数据更新时间

### POST `/device/attribute/history` — 获取设备指定属性历史数据（getDeviceAttributeKeysHistoryPageUsingPOST）

**Request Body:**
```json
{
  "deviceId": 0,
  "attributeKeys": ["soc", "acPower", "solarPower"],
  "startTime": "2026-05-01T00:00:00Z",
  "endTime": "2026-05-10T00:00:00Z",
  "pageNumber": 1,
  "pageSize": 288
}
```

### GET `/device/attributes` — 获取设备采集属性列表（getGatherDeviceAttributesUsingGET）
**Query Params:** `deviceId`

---

## 四、远程设备控制服务 Remote Device Control Service

### GET `/remote/device/state/latest` — 获取设备最近状态数据（getDeviceAttributeStateUsingGET）

**Query Params:**
- `deviceId` *required (integer)
- `dataSource` (integer, optional)

**Response data:**
```json
{
  "deviceId": "string",
  "dtuID": "string",
  "time": "2026-05-10T00:00:00Z",
  "stationId": "string",
  "gatherProtocolNumber": "string",
  "gatherProtocolVersionCode": "string",
  "fields": {
    "soc": {
      "key": "soc",
      "name": "Battery SOC",
      "value": 85,
      "valueDisplay": "85%",
      "unit": "%",
      "valueType": "float",
      "category": "string"
    },
    "acPower": { "key": "acPower", "value": 1200, "unit": "W" },
    "solarPower": { "key": "solarPower", "value": 800, "unit": "W" }
  },
  "groups": [
    {
      "id": 0,
      "key": "string",
      "name": "string",
      "category": "string",
      "stateItems": []
    }
  ],
  "firingAlarms": [
    {
      "id": 0,
      "key": "string",
      "name": "string",
      "level": "string",
      "description": "string",
      "status": "string",
      "createdAt": "2026-05-10T00:00:00Z",
      "isProcessed": false,
      "isRead": false,
      "deviceId": 0,
      "deviceName": "string",
      "deviceSerialNumber": "string",
      "stationId": 0
    }
  ]
}
```

### POST `/remote/device/config/write` — 写入设备配置（远程控制）

**Query Params:**
- `deviceId` *required (integer)

**Request Body:**
```json
{
  "key": "string",
  "value": {}
}
```
> 用于控制 AC 开关、USB 开关、充电限制等设备参数

**Response 200:**
```json
{ "code": 0, "message": "string", "localMessage": "string" }
```

### POST `/remote/device/config/read` — 读取单个配置项

### POST `/remote/device/configs/read` — 批量读取配置项

### GET `/remote/device/configs/read/details` — 获取批量读取详情

### GET `/remote/device/energy/flow` — 获取设备能量流动（getDeviceEnergyFlowUsingGET）
**Query Params:** `deviceId`

### POST `/remote/device/passthrough` — 透传数据

### POST `/remote/device/state/report/fast/start` — 启动速报（实时数据快速上报）
### POST `/remote/device/state/report/fast/stop` — 停止速报
### GET `/remote/device/state/report/fast/supported` — 检查是否支持速报

---

## 五、告警服务 Alarm Service

### POST `/alarm/latest` — 获取最近一条告警（getLatestAlarmUsingPOST）

### POST `/alarm/search` — 查询告警列表（searchAlarmsUsingPOST）

**Request Body:**
```json
{
  "deviceId": 0,
  "stationId": 0,
  "pageNumber": 1,
  "pageSize": 20,
  "isProcessed": false,
  "startTime": "2026-05-01T00:00:00Z",
  "endTime": "2026-05-10T00:00:00Z"
}
```

### POST `/alarm/delete` — 删除告警
### POST `/alarm/ignore` — 忽略告警

---

## 六、削峰填谷服务 Peak Valley Service（Smart Schedule）

### GET `/peak/valley/device/attribute/group` — 获取设备削峰填谷采集属性分组
**Query Params:** `deviceId`

### GET `/peak/valley/general` — 获取设备常规削峰填谷配置（getDeviceGeneralPeakValleyUsingGET）
**Query Params:** `deviceId`

### POST `/peak/valley/general` — 设置设备常规削峰填谷（setDeviceGeneralPeakValleyUsingPOST）

### GET `/peak/valley/bundle` — 获取设备削峰填谷详情（getDevicePeakValleyBundleUsingGET）
**Query Params:** `deviceId`

### POST `/peak/valley/enable` — 使能削峰填谷（enableDevicePeakValleyBundleUsingPOST）

### POST `/peak/valley/customized` — 设置自定义削峰填谷（setDeviceCustomizedPeakValleyUsingPOST）

### GET `/peak/valley/types` — 获取设备支持的削峰填谷类型
**Query Params:** `deviceId`

### GET `/peak/valley/types/all` — 获取所有削峰填谷类型

---

## 七、App 扫码服务 App Scan Code Service

### POST `/scan/qrcode/login` — 二维码登录确认（scanQRCodeLoginUsingPOST）

---

## 八、设备模式服务 Device Apply Mode Service

> 对应 App 中的 Sleep / Backup / Saving Mode 切换

---

## 九、设备应用模式服务（Device Apply Mode）

用于切换设备运行模式（Sleep/Backup/Saving），具体接口路径待补充。

---

## 十、常用属性 Key 参考

> 以下 key 用于 `/remote/device/state/latest` 的 `fields` 和 `/remote/device/config/write` 的 `key`

| 属性 Key | 说明 | 单位 |
|---------|------|------|
| `soc` | 电池电量 | % |
| `batteryPower` | 电池功率 | W |
| `batteryVoltage` | 电池电压 | V |
| `batteryTemp` | 电池温度 | °C |
| `acPower` | AC 输出功率 | W |
| `acVoltage` | AC 电压 | V |
| `solarPower` | 光伏输入功率 | W |
| `solarVoltage` | 光伏电压 | V |
| `outputPower` | 总输出功率 | W |
| `acOut1Enable` | AC Out 1 开关 | boolean |
| `acOut2Enable` | AC Out 2 开关 | boolean |
| `usbOut1Enable` | USB Out 1 开关 | boolean |
| `sleepMode` | 睡眠模式 | boolean |
| `workMode` | 工作模式（0=正常/1=备份/2=节能） | integer |
| `chargeLimit` | 充电上限 | % |
| `dischargeLimit` | 放电下限 | % |

> **注意**：实际 key 名称需以真实设备采集协议为准，通过 `/device/attributes?deviceId=xxx` 获取完整列表。

---

## 请求头鉴权说明

参考 `src/utils/iotSign.ts` 实现的 IoT-Open 签名机制：

```
Headers:
  Content-Type: application/json
  appId: rYGQpmYU5k
  timestamp: <当前时间戳毫秒>
  sign: MD5(appId + appSecret + timestamp)
  accessToken: <登录后获取的 token>
```

登录接口 `/login/account` 不需要签名（postNoSign）。
