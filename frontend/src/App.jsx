import React from 'react'
import {BrowserRouter, Routes, Route} from 'react-router-dom'
import Home from './pages/Home'
import EmployeePred from './pages/employee/employeePred'
import Navbar from './components/Navbar'
import InvestorPred from './pages/investor/investorPred'
import StudentPred from './pages/student/studentPred'

const App = () => {
  return (
    <BrowserRouter>
      <Navbar/>
      <Routes>
        <Route path='/' element={<Home />} />
        <Route path='/employee/predict' element={<EmployeePred />} />
        <Route path='/investor/predict' element={< InvestorPred/>} />
        <Route path='/student/predict' element={< StudentPred/>} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
