import React from 'react'
import {BrowserRouter, Routes, Route} from 'react-router-dom'
import Home from './pages/Home'
import EmployeePred from './pages/employee/employeePred'

const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path='/' element={<Home />} />
        <Route path='/employee/predict' element={<EmployeePred />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
