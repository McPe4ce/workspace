import { useRef, useEffect } from 'react'

// Render "Mr. Mak" as particle dots.
// Technique: draw text to an offscreen canvas, sample pixels, draw each as a dot.
// Drawn once (no animation loop) so the sidebar costs no GPU time while idle.
// Re-draws once webfonts finish loading so the glyphs stay crisp.

export default function MakText({ height = 28 }: { height?: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const dpr = window.devicePixelRatio || 1
    const textH = height
    let cancelled = false

    const draw = () => {
      const offscreen = document.createElement('canvas')
      const offCtx = offscreen.getContext('2d')
      if (!offCtx) return
      const fontSize = height * 0.85
      const font = `700 ${fontSize}px "Inter", "Segoe UI", system-ui, sans-serif`
      offCtx.font = font
      const textW = Math.ceil(offCtx.measureText('Mr. Mak').width) + 4

      offscreen.width = textW
      offscreen.height = textH
      offCtx.font = font
      offCtx.fillStyle = '#fff'
      offCtx.textBaseline = 'middle'
      offCtx.fillText('Mr. Mak', 1, textH / 2)

      canvas.width = textW * dpr
      canvas.height = textH * dpr
      canvas.style.width = `${textW}px`
      canvas.style.height = `${textH}px`
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

      const data = offCtx.getImageData(0, 0, textW, textH).data
      const dots = new Path2D()
      const step = 1.8  // density of dots
      for (let y = 0; y < textH; y += step) {
        for (let x = 0; x < textW; x += step) {
          const alpha = data[(Math.floor(y) * textW + Math.floor(x)) * 4 + 3]
          if (alpha <= 100) continue
          dots.moveTo(x + 0.75, y)
          dots.arc(x, y, 0.75, 0, Math.PI * 2)
        }
      }
      ctx.fillStyle = 'rgba(235, 235, 240, 0.55)'
      ctx.fill(dots)
    }

    draw()
    // Inter may swap in after first paint — re-draw for crisp glyphs.
    document.fonts?.ready.then(() => { if (!cancelled) draw() })

    return () => { cancelled = true }
  }, [height])

  return <canvas ref={canvasRef} style={{ height, display: 'block' }} />
}
