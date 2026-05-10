import { isValidElement, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import useTransitions from '../../hooks/useTransitions'
import { motion } from 'framer-motion'
import { TbBan } from 'react-icons/tb'
import getCssGradient from '../../functions/generationUtils/getCssGradient'
import gC from '../../functions/generationUtils/getClasses'
import classes from './Card.module.css'

const PLATE_TRANSITION_DURATION = .75
const LOGO_TRANSITION_DURATION = .15
const LOGO_TRANSITION_DELAY = .25
const LOGO_SCALE_SIZE = .3

function Card({ active=false, visibility=true, icon, bgColor, textColor, macroName='', matchStart=0, matchLength=0, matchColor='', revealCount=0, isHintActive=false, tabFocused=false, onClick }) {
  const [isAnimated, setIsAnimated] = useState(false)

  const backgroundStyle = useMemo(() => getCssGradient(bgColor), [bgColor])
  const [styles, setStyles] = useState({
    logo: {
      instant: {
        color: textColor
      },
      transition: {
        ease: 'easeOut',
        duration: LOGO_TRANSITION_DURATION,
        delay: LOGO_TRANSITION_DELAY
      }
    },
    plate: {
      instant: {
        '--secondary': backgroundStyle
      },
      transition: {
        duration: PLATE_TRANSITION_DURATION
      }
    }
  })

  const logoRef = useRef(null)
  const plateRef = useRef(null)
      
  const detachableElements =
    <>
      <motion.div
        ref={logoRef}
        className={gC(classes['logo'], active && classes['detached'])}
        style={styles?.logo?.instant}
        animate={styles?.logo?.animate}
        transition={styles?.logo?.transition}>
          { getIcon(icon, textColor) }
      </motion.div>
      <motion.div
        ref={plateRef}
        className={gC(classes['plate'], active && classes['detached'])}
        style={styles?.plate?.instant}
        animate={styles?.plate?.animate}
        transition={styles?.plate?.transition}
        onAnimationComplete={() => {
          if (active) window.cardRedirectAnimationEnd?.()
        }}/>
    </>

  const state = active ? 'activated' : 'default'
  const animations = useMemo(() => {
    return ({
      transitions: {
        activated: {
          default() {
            setIsAnimated(true)
            const logoRect = logoRef.current.getBoundingClientRect()
            const plateRect = plateRef.current.getBoundingClientRect()
            const scales = {
              logo: 
                Math.min(window.innerWidth, window.innerHeight) 
                / Math.min(logoRect.width, logoRect.height) 
                * LOGO_SCALE_SIZE,
              plate: 
                Math.sqrt(window.innerWidth**2 + window.innerHeight**2)
                / Math.min(plateRect.width, plateRect.height)
                * Math.max(
                  ((window.innerWidth - plateRect.right) + plateRect.width/2) / window.innerWidth, 
                  (plateRect.left + plateRect.width/2) / window.innerWidth, 
                  (plateRect.top + plateRect.height/2) / window.innerHeight, 
                  ((window.innerHeight - plateRect.bottom) + plateRect.height/2) / window.innerHeight
                )
                * 2
                + .1
            }
            setStyles(s => {
              const styles = structuredClone(s)
              return ({
                ...styles,
                logo: {
                  ...styles?.logo,
                  instant: {
                    ...styles?.logo?.instant,
                    left: logoRect.left,
                    top: logoRect.top,
                    height: logoRect.height,
                    width: logoRect.width,
                    position: 'absolute',
                    margin: 0
                  },
                  animate: {
                    ...styles?.logo?.animate,
                    left: '50%',
                    top: '50%',
                    translateX: '-50%',
                    translateY: '-50%',
                    scale: scales.logo
                  }
                },
                plate: {
                  ...styles?.plate,
                  instant: {
                    ...styles?.plate?.instant,
                    left: plateRect.left,
                    top: plateRect.top,
                    height: plateRect.height,
                    width: plateRect.width
                  },
                  animate: {
                    ...styles?.plate?.animate,
                    scale: scales.plate
                  }
                }
              })
            })
          }
        }
      }
    })
  }, [])
  useTransitions(state, animations, visibility)

  return (
    <div
      className={gC('card', classes['card'], active && classes['active'], isHintActive && revealCount > 0 && classes['label-visible'])}
      style={{ '--macro-text': textColor, '--match-color': matchColor || textColor }}
      data-tab-focused={tabFocused || undefined}
      onClick={onClick}>
      <div className={classes['logo-wrapper']}>
        { 
          isAnimated
          ? createPortal(
              detachableElements,
              document.getElementById('root')
            )
          : detachableElements
        }
      </div>
      <div className={classes['label-row']}>
        {isHintActive && revealCount > 0 && (() => {
          if (matchLength === 0) {
            return (
              <span key="h0" className={gC(classes['label-char'], classes['label-char-new'])}>
                {macroName[0] ?? ''}
              </span>
            )
          }

          const prefixEnd  = matchStart
          const matchEnd   = matchStart + matchLength
          const hintChar   = macroName[matchEnd] ?? ''

          return (
            <>
              {macroName.slice(0, prefixEnd).split('').map((ch, i) => (
                <span key={`p${i}`} className={classes['label-char']}>{ch}</span>
              ))}
              {macroName.slice(prefixEnd, matchEnd).split('').map((ch, i) => (
                <span key={`m${i}`} className={gC(classes['label-char'], classes['label-char-match'])}>{ch}</span>
              ))}
              {hintChar && (
                <span key="hint" className={gC(classes['label-char'], classes['label-char-new'])}>{hintChar}</span>
              )}
            </>
          )
        })()}
      </div>
    </div>
  )
}

function getIcon(icon, color) {
  if (isValidElement(icon))
    return <div>{icon}</div>

  else if (typeof icon === 'string' && Object.prototype.hasOwnProperty.call(window.ICONS, icon)) 
    return <div dangerouslySetInnerHTML={{__html: window.ICONS?.[icon]}}/>

  return <div><TbBan color={color}/></div>
}

export default Card
