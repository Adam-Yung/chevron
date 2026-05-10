import { forwardRef, useEffect } from 'react'
import autosize from 'autosize'

const TextareaAutosize = forwardRef((props, ref) => {
  useEffect(() => {
    autosize(ref.current)
    props.setHeight(ref.current.offsetHeight)
  }, [props.value, ref, props.setHeight])
  
  // fix for the bug when textarea's value doesn't reset after history back
  useEffect(() => {
    ref.current.value = props.value
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <textarea {...props} rows={1} ref={ref}/>
  )
})
TextareaAutosize.displayName = 'TextareaAutosize'

export default TextareaAutosize