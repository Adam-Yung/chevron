const easings = {
  linear: t => t,
  'ease-in': t => t * t,
  'ease-out': t => 1 - (1 - t) * (1 - t),
  'ease-in-out': t => t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2,
  easeInQuad: t => t * t,
  easeOutQuad: t => 1 - (1 - t) * (1 - t),
  easeInOutQuad: t => t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2,
  easeOutCubic: t => 1 - Math.pow(1 - t, 3),
  easeInBack: t => { const c = 2.70158; return (c + 1) * t * t * t - c * t * t },
}

export default class CanvasRenderer {
  constructor(canvas, { width, height, color, thickness, stages }) {
    this.ctx = canvas.getContext('2d')
    this.width = width
    this.height = height
    this.color = color
    this.thickness = thickness
    this.stages = stages
    this.currentPoints = new Float32Array(stages[0])
    this.fromPoints = new Float32Array(stages[0])
    this.animating = false
    this.draw()
  }

  postMessage(data) {
    switch (data.type) {
      case 'morph':
        this.morph(data.stage, data.duration, data.ease)
        break
      case 'snap':
        this.currentPoints = new Float32Array(this.stages[data.stage])
        this.fromPoints = new Float32Array(this.currentPoints)
        this.animating = false
        this.draw()
        break
      case 'updateStyle':
        if (data.color !== undefined) this.color = data.color
        if (data.thickness !== undefined) this.thickness = data.thickness
        this.draw()
        break
      case 'resize':
        this.width = data.width
        this.height = data.height
        this.draw()
        break
    }
  }

  morph(stageIdx, duration, ease) {
    this.fromPoints = new Float32Array(this.currentPoints)
    const targetPoints = this.stages[stageIdx]
    const durationMs = duration * 1000
    const easeFn = easings[ease] || easings.linear
    const startTime = performance.now()
    this.animating = true

    const animate = () => {
      const elapsed = performance.now() - startTime
      const rawProgress = Math.min(elapsed / durationMs, 1)
      const t = easeFn(rawProgress)

      for (let i = 0; i < this.currentPoints.length; i++) {
        this.currentPoints[i] = this.fromPoints[i] + (targetPoints[i] - this.fromPoints[i]) * t
      }

      this.draw()

      if (rawProgress < 1 && this.animating) {
        requestAnimationFrame(animate)
      } else {
        this.animating = false
      }
    }

    requestAnimationFrame(animate)
  }

  draw() {
    const { ctx, width, height, currentPoints, color, thickness } = this
    if (!ctx) return
    const scaleX = width / 1.0
    const scaleY = height / 1.0
    const offsetX = 0.5 * scaleX

    ctx.clearRect(0, 0, width, height)
    ctx.beginPath()

    ctx.moveTo(currentPoints[0] * scaleX + offsetX, currentPoints[1] * scaleY)
    ctx.bezierCurveTo(
      currentPoints[2] * scaleX + offsetX, currentPoints[3] * scaleY,
      currentPoints[4] * scaleX + offsetX, currentPoints[5] * scaleY,
      currentPoints[6] * scaleX + offsetX, currentPoints[7] * scaleY
    )

    ctx.moveTo(currentPoints[0] * scaleX + offsetX, currentPoints[1] * scaleY)
    ctx.bezierCurveTo(
      currentPoints[8] * scaleX + offsetX, currentPoints[9] * scaleY,
      currentPoints[10] * scaleX + offsetX, currentPoints[11] * scaleY,
      currentPoints[12] * scaleX + offsetX, currentPoints[13] * scaleY
    )

    ctx.lineWidth = thickness
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.strokeStyle = color
    ctx.stroke()
  }
}
