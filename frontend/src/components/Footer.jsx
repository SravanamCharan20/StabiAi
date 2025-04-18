import React from 'react'
import { Link } from 'react-router-dom'

const Footer = () => {
  return (
    <>
    <div className='flex rounded-full  justify-center'>
        <div className='text-8xl p-4 text-transparent text-medium bg-clip-text bg-gradient-to-r from-slate-700 to-purple-600 mb-10'>StabilityAI</div>
        <div>
            <Link className='text-black text-2xl' to='https://github.com/SravanamCharan20/StabiAi' target="_blank" rel="noopener noreferrer">Github</Link>
        </div>
    </div>
    </>
  )
}

export default Footer