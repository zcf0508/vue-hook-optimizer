export default () => {
  const [open, setOpen] = useState(false)

  const [xx] = useState('')
  
  function processInfo() {
    console.log(open)
  }

  const writeBaseInfo = () => {
    console.log(xx)
  }

  return (
    <AModal 
      value={open} 
      title='基本信息' 
      onClick={writeBaseInfo} 
      onFocus={() => processInfo()} 
      onOk={(a) => setOpen(a)}
    >
      <p>hello</p>
      <p>{xx}</p>	
    </AModal>
  )
}