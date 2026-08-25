let ctx, width, height, color, thickness
let stages = []
let currentPoints, fromPoints, targetPoints
let animating = false
let startTime, duration, easeFn

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

self.onmessage = ({ data }) => {
  switch (data.type) {
    case 'init': {
      ctx = data.canvas.getContext('2d')
      width = data.width
      height = data.height
      color = data.color
      thickness = data.thickness
      stages = data.stages
      currentPoints = new Float32Array(stages[0])
      fromPoints = new Float32Array(stages[0])
      draw()
      break
    }
    case 'resize': {
      width = data.width
      height = data.height
      draw()
      break
    }
    case 'morph': {
      fromPoints = new Float32Array(currentPoints)
      targetPoints = stages[data.stage]
      duration = data.duration * 1000
      easeFn = easings[data.ease] || easings.linear
      startTime = performance.now()
      if (!animating) animate()
      break
    }
    case 'snap': {
      currentPoints = new Float32Array(stages[data.stage])
      fromPoints = new Float32Array(currentPoints)
      animating = false
      draw()
      break
    }
    case 'updateStyle': {
      if (data.color !== undefined) color = data.color
      if (data.thickness !== undefined) thickness = data.thickness
      draw()
      break
    }
  }
}

function animate() {
  animating = true
  const elapsed = performance.now() - startTime
  const rawProgress = Math.min(elapsed / duration, 1)
  const t = easeFn(rawProgress)

  for (let i = 0; i < currentPoints.length; i++) {
    currentPoints[i] = fromPoints[i] + (targetPoints[i] - fromPoints[i]) * t
  }

  draw()

  if (rawProgress < 1) {
    requestAnimationFrame(animate)
  } else {
    animating = false
  }
}

function draw() {
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
