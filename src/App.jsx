import "react-toastify/dist/ReactToastify.css";
import './App.css'
import {BrowserRouter, Navigate, Route, Routes} from 'react-router-dom';
import AdLogin from './page/AdLogin';
import Login from './page/Login';
import AdminDash from './component/AdminDash';
import UserDash from './component/UserDash';
import { ToastContainer } from "react-toastify";
import CharityManagement from "./component/admin/CharityManagement";
import DrawManagement from "./component/admin/DrawManagement";
import ReportsAnalytics from "./component/admin/ReportsAnalytics";
import UserManagement from "./component/admin/UserManagement";
import WinnersManagement from "./component/admin/WinnersManagement";

function App() {
  return (
    <>
     <div className="container-fluid p-0">
    
      <BrowserRouter>
      <Routes>
        <Route path='/' element={<Navigate to="/login" replace />} />
        <Route path='/admin' element={<AdLogin/>} />
        <Route path='/login' element={<Login/>} />
        <Route path='/dashboard' element={<AdminDash/>} />
        <Route path='/userdashboard' element={<UserDash/>} />
        <Route path='/admindash' element={<Navigate to="/dashboard" replace />} />
        <Route path='/charitymanagement' element={<CharityManagement/>} />
        <Route path='/drawmanagement' element={<DrawManagement/>} />
        <Route path='/reportsanalytics' element={<ReportsAnalytics/>} />
        <Route path='/usermanagement' element={<UserManagement/>} />
        <Route path='/winnersmanagement' element={<WinnersManagement/>} />
        <Route path='*' element={<Navigate to="/login" replace />} />
      </Routes>
      <ToastContainer position="top-right" autoClose={2000} />
      </BrowserRouter>

     </div>
    </>
  )
}

export default App
