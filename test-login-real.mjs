/**
 * 使用真实凭证测试登录接口
 * AppID: rYGQpmYU5k
 * AppSecret: GhJXQYEHphHlyiqYnBGE
 */

import CryptoJS from 'crypto-js'

// ─── 签名函数（复制自 iotSign.ts）───
function generateNonce() {
  const arr = new Uint8Array(16)
  crypto.getRandomValues(arr)
  return Array.from(arr)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
}

function sha256Hex(text) {
  return CryptoJS.SHA256(CryptoJS.enc.Utf8.parse(text)).toString(CryptoJS.enc.Hex).toLowerCase()
}

function toBase64(text) {
  const wordArray = CryptoJS.enc.Utf8.parse(text)
  return CryptoJS.enc.Base64.stringify(wordArray)
}

function hmacSHA256(message, key) {
  return CryptoJS.HmacSHA256(message, key)
}

function md5Hex(data) {
  return CryptoJS.MD5(data).toString(CryptoJS.enc.Hex).toLowerCase()
}

function calcSign({ method, urlParams = {}, body = '', nonce }) {
  const appId = 'rYGQpmYU5k'
  const appSecret = 'GhJXQYEHphHlyiqYnBGE'

  // Step1: Body Hash
  const isGet = method.toUpperCase() === 'GET'
  const bodyHash = isGet ? '' : sha256Hex(body)

  // Step2 & 3: 合并参数并排序（ASCII 顺序）
  const allParams = {
    ...urlParams,
    'IOT-Open-AppID': appId,
    'IOT-Open-Nonce': nonce,
    'IOT-Open-Body-Hash': bodyHash,
  }

  const sorted = Object.entries(allParams).sort(([a], [b]) => a < b ? -1 : a > b ? 1 : 0)

  // Step 4: 拼接
  const plainText = sorted.map(([k, v]) => `${k}=${v}`).join('&')

  // Step 5: Base64
  const base64Text = toBase64(plainText)

  // Step 6: HmacSHA256
  const hmacResult = hmacSHA256(base64Text, appSecret)

  // Step 7: MD5
  const sign = md5Hex(hmacResult)

  return {
    'IOT-Open-AppID': appId,
    'IOT-Open-Nonce': nonce,
    'IOT-Open-Sign': sign,
  }
}

// ─── 测试登录 ───
async function tryLogin(account, password) {
  const nonce = generateNonce()
  const body = JSON.stringify({ account, password })

  const signHeaders = calcSign({
    method: 'POST',
    body,
    nonce,
  })

  console.log(`\n=== 尝试登录: ${account} / ${password} ===`)
  console.log('Nonce:', nonce)
  console.log('Sign:', signHeaders['IOT-Open-Sign'])

  try {
    const resp = await fetch('https://solar.siseli.com/apis/login/account', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json;charset=UTF-8',
        ...signHeaders,
      },
      body,
    })

    const text = await resp.text()
    console.log('Status:', resp.status)
    console.log('Body:', text)

    // 尝试解析token
    try {
      const json = JSON.parse(text)
      if (json.code === 0 || json.code === 200) {
        console.log('✅ 登录成功！Token:', json.data?.token || json.data?.accessToken)
        return true
      }
    } catch {}
    return false
  } catch (err) {
    console.error('请求失败:', err.message)
    return false
  }
}

async function testLogin() {
  const account = 'jason1324'
  // 直接测试提供的密码，并显示详细调试信息
  const password = 'jjww1324-LJ'

  console.log('=== 测试登录 ===')
  console.log('Account:', account)
  console.log('Password:', password)
  console.log('Password length:', password.length)
  console.log('Password chars:', [...password].map(c => c.charCodeAt(0)))
  
  // 直接发送请求，显示完整请求体
  const body = JSON.stringify({ account, password })
  console.log('Request body:', body)
  console.log('Request body bytes:', [...new TextEncoder().encode(body)])

  const success = await tryLogin(account, password)

  if (success) {
    console.log('\n✅ 登录成功！')
  } else {
    console.log('\n❌ 登录失败，请确认：')
    console.log('1. 密码是否正确（注意大小写、特殊字符）')
    console.log('2. 账号是否已在平台上激活')
    console.log('3. 尝试在平台上重置密码')
  }
}

testLogin()
