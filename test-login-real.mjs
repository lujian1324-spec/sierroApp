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
  // 尝试密码变体
  const passwords = [
    'jjww1324-LJ',
    'jjww1324-lj',
    'jjww1324-Lj',
    'jjww1324',
    'JJWW1324-LJ',
  ]

  console.log('=== 尝试多个密码变体 ===')
  console.log('Account:', account)

  for (const pwd of passwords) {
    const success = await tryLogin(account, pwd)
    if (success) {
      console.log(`\n✅ 登录成功！密码: ${pwd}`)
      return
    }
    await new Promise(r => setTimeout(r, 300))
  }
  console.log('\n❌ 所有密码变体均失败，请确认正确密码。')
}

testLogin()
