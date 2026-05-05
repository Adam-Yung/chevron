import { useContext, useMemo } from 'react'
import { SettingsContext } from '../../contexts/Settings'
import Marquee from 'react-fast-marquee'
import getCssGradient from '../../functions/generationUtils/getCssGradient'
import classes from './InteractiveBackground.module.css'

function InteractiveBackground({
  width,
  height,
  color, // background color (can be a single string or an array of 2 strings for gradient)
  marqueeText='',
  marqueeSpeed=25,
  marqueeAngle=330,
  lineDensity=15, // space between lines
  rowDensity=6, // space between rows
  textColor='#d2d2d2',
  textSize='5vmin',
  textOpacity=.2,
  style={}
}) {
  // settings
  const settings = useContext(SettingsContext)
  const enableMarquee = settings.chevron.quickLook.marquee

  // Memoize the row/line tree (~90 elements) so it isn't reallocated on
  // every render (e.g. on every resize-driven re-render of the parent).
  const marquee = useMemo(() => {
    if (!marqueeText || !enableMarquee) return null
    /*
      Marquee system consists of {rowDensity} of rows
      and each row consists of {lineDensity} of lines
    */
    const lines = []
    for (let i = 0; i < lineDensity; i++) {
      lines.push(<div key={i}>{marqueeText}</div>)
    }
    const totalRows = (marqueeText.length < 5) ? rowDensity * 2 : rowDensity
    const rows = []
    for (let i = 0; i < totalRows; i++) {
      rows.push(
        <div key={i} className={classes['row']}>
          {lines}
        </div>
      )
    }
    return (
      <Marquee
        className={classes['marquee']}
        gradient={false}
        speed={marqueeSpeed}>
        {rows}
      </Marquee>
    )
  }, [marqueeText, enableMarquee, lineDensity, rowDensity, marqueeSpeed])
  
  /*
    find the diagonal of the window for propper scale of .container
    .container element must be a square with sides >= diagonal of the window
    to be bigger than .viewport at any angle of rotation
  */
  const diagonal = Math.sqrt(Math.pow(width, 2) + Math.pow(height, 2))
  
  // css variables
  const variables = {
    '--diagonal': diagonal + 'px',
    '--rotation-angle': marqueeAngle + 'deg',
    '--text-color': textColor,
    '--text-size': textSize,
    '--text-opacity': textOpacity,
    '--secondary': getCssGradient(color)
  }
  

  return (
    <div 
      className={classes['viewport']} 
      style={{...variables, ...style}}>
      <div className={classes['container']}>
        { marquee }
      </div>
    </div>
  )
}

export default InteractiveBackground