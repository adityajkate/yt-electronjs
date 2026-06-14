const https = require('https')
const fs = require('fs')
const path = require('path')

const PLATFORMS = {
  'win32': { url: 'https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp.exe', name: 'yt-dlp.exe' },
  'darwin': { url: 'https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp_macos', name: 'yt-dlp' },
  'linux': { url: 'https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp', name: 'yt-dlp' },
}

async function downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest)
    https.get(url, (response) => {
      if (response.statusCode === 302 || response.statusCode === 301) {
        file.close()
        fs.unlinkSync(dest)
        return downloadFile(response.headers.location, dest).then(resolve).catch(reject)
      }
      response.pipe(file)
      file.on('finish', () => {
        file.close()
        if (process.platform !== 'win32') fs.chmodSync(dest, '755')
        resolve()
      })
    }).on('error', (err) => { fs.unlinkSync(dest); reject(err) })
  })
}

async function main() {
  const platform = process.platform
  const config = PLATFORMS[platform]
  if (!config) { console.error(`Unsupported platform: ${platform}`); process.exit(1) }
  const dlDir = path.join(__dirname, '..', 'resources', 'yt-dlp')
  if (!fs.existsSync(dlDir)) fs.mkdirSync(dlDir, { recursive: true })
  const dest = path.join(dlDir, config.name)
  if (fs.existsSync(dest)) { console.log(`yt-dlp already exists at ${dest}`); return }
  console.log(`Downloading yt-dlp for ${platform}...`)
  await downloadFile(config.url, dest)
  console.log(`Downloaded to ${dest}`)
}

main().catch(console.error)
