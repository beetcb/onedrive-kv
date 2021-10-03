import crypto from 'node:crypto'
import fetch from 'node-fetch'
import { Buffer } from 'node:buffer'

const parseStrs = (strs, parmas) =>
  [strs.indexOf('drive'), strs.indexOf('id'), strs.indexOf('path'), strs.indexOf('select')].map((idx) => parmas[idx])
const getGraptAPI = (strs, ...parmas) => {
  const [drive, path, select] = parseStrs(strs, parmas)
  return `${drive}/root:${join(...path)}${select ? `?$select=${select}` : ''}`
}
const getGraphEndpoint = (key) =>
  getGraptAPI`drive${process.env.drive_api}path${[
    '/',
    base_dir,
    `db/${createHash('md5').update(key, 'utf8').digest('hex')}:/content`,
  ]}}`

const getFetchOpts = (a_t, opts) => {
  const { body, contentType, method } = opts ?? {}
  const options = {
    headers: {
      Authorization: `bearer ${a_t}`,
      'Content-Type': body && contentType,
    },
    method: body && method,
    body: body,
    compress: false,
  }
  return options
}

const checkExpired = (token) => {
  const { expires_at } = token
  if (timestamp() > expires_at) {
    console.log('Token expired')
    return true
  }
}
const timestamp = () => (Date.now() / 1000) | 0

const base_dir = process.env.base_dir || ''
const getGraphEndpoint = (key) =>
  getItem`drive${process.env.drive_api}path${[
    '/',
    base_dir,
    `db/${crypto.createHash('md5').update(key, 'utf8').digest('hex')}:/content`,
  ]}}`

const algorithm = 'aes-192-cbc'
const iv = Buffer.alloc(16)
const key = crypto.scryptSync(process.env.ENCRYPT_PASSWORD, 'salt', 24)

function encrypt(text) {
  const cipher = crypto.createCipheriv(algorithm, key, iv)
  const encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()])
  return encrypted
}
function decrypt(encrypted) {
  const decipher = crypto.createDecipheriv(algorithm, key, iv)
  const decrypted = decipher.update(encrypted, 'buffer', 'utf8') + decipher.final('utf8')
  return decrypted
}

async function getToken(access_token) {
  // TODO
}

export async function set(key, value, access_token) {
  const graph = getGraphEndpoint(key)
  const res = await fetch(
    graph,
    getFetchOpts(access_token, {
      contentType: 'text/plain',
      method: 'PUT',
      body: encrypt(value),
    })
  )

  if (res.ok) {
    return true
  } else {
    console.error(res)
    return null
  }
}

export async function get(key, access_token) {
  const graph = getGraphEndpoint(key)
  const res = await fetch(graph, getFetchOpts(access_token))
  if (res.ok) {
    const data = await res.buffer()
    return decrypt(data)
  } else {
    console.error(res.statusText)
    return null
  }
}
