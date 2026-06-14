// src/main/services/streaming-server.ts
import http from 'http'
import fs from 'fs'
import path from 'path'
import { app } from 'electron'

let server: http.Server | null = null
let currentPort = 0

export function getStreamingPort(): number {
  return currentPort
}

export async function startStreamingServer(): Promise<number> {
  return new Promise((resolve, reject) => {
    server = http.createServer((req, res) => {
      // URL format: /stream/{videoId}.{ext}
      const match = req.url?.match(/\/stream\/(.+)\.(\w+)$/)
      if (!match) {
        res.writeHead(404)
        res.end()
        return
      }

      const videoId = match[1]
      const ext = match[2]
      const filePath = getFilePathForStream(videoId, ext)

      if (!filePath || !fs.existsSync(filePath)) {
        res.writeHead(404)
        res.end('File not found')
        return
      }

      const stat = fs.statSync(filePath)
      const fileSize = stat.size
      const range = req.headers.range

      if (range) {
        const parts = range.replace(/bytes=/, '').split('-')
        const start = parseInt(parts[0], 10)
        const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1
        const chunksize = end - start + 1

        const stream = fs.createReadStream(filePath, { start, end })
        res.writeHead(206, {
          'Content-Range': `bytes ${start}-${end}/${fileSize}`,
          'Accept-Ranges': 'bytes',
          'Content-Length': chunksize,
          'Content-Type': getMimeType(ext),
        })
        stream.pipe(res)
      } else {
        res.writeHead(200, {
          'Content-Length': fileSize,
          'Content-Type': getMimeType(ext),
          'Accept-Ranges': 'bytes',
        })
        fs.createReadStream(filePath).pipe(res)
      }
    })

    server.listen(0, '127.0.0.1', () => {
      const addr = server?.address()
      if (addr && typeof addr === 'object') {
        currentPort = addr.port
        resolve(currentPort)
      } else {
        reject(new Error('Failed to get port'))
      }
    })

    server.on('error', reject)
  })
}

export function stopStreamingServer(): void {
  if (server) {
    server.close()
    server = null
    currentPort = 0
  }
}

function getFilePathForStream(videoId: string, ext: string): string | null {
  const cacheDir = path.join(app.getPath('userData'), 'cache')
  const candidate = path.join(cacheDir, `${videoId}.${ext}`)
  if (fs.existsSync(candidate)) return candidate

  const downloadDir = path.join(app.getPath('userData'), 'downloads')
  const candidate2 = path.join(downloadDir, `${videoId}.${ext}`)
  if (fs.existsSync(candidate2)) return candidate2

  return null
}

function getMimeType(ext: string): string {
  const map: Record<string, string> = {
    aac: 'audio/aac',
    m4a: 'audio/mp4',
    mp3: 'audio/mpeg',
    webm: 'audio/webm',
    ogg: 'audio/ogg',
    wav: 'audio/wav',
  }
  return map[ext] || 'application/octet-stream'
}

export function getStreamUrl(videoId: string, ext: string = 'aac'): string {
  return `http://127.0.0.1:${currentPort}/stream/${videoId}.${ext}`
}
