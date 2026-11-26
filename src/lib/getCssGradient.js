// Colours come from user-editable config: anything malformed paints transparent instead of throwing during render.
function getCssGradient(options) {
  if (typeof options === 'string') return options
  switch (options?.type) {
    case 'solid':
      return options.color
    case 'gradient': {
      let _angle = options.angle ?? (options.gradientType === 'linear' ? 45 : '')
      if (typeof _angle === 'number') 
        _angle = _angle + 'deg'
      if (_angle)
        _angle += ','
    
      if (!Array.isArray(options.colors) || !options.colors.length) return 'transparent'
      let _colors = [...options.colors]
      
      if (options.stops)
        options.stops.forEach((value, index) => _colors[index] += ` ${value}%`)

      _colors = _colors.join(',')
      
      return `${options.gradientType}-gradient(${_angle}${_colors})`
    }
    default: return 'transparent'
  }
}

export default getCssGradient
