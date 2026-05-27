import React, { useState } from 'react'
import { FiEye, FiEyeOff } from 'react-icons/fi'
import { HiOutlineMail } from 'react-icons/hi'
import { FaLock } from 'react-icons/fa'
import './App.css'

function App() {
  const [showPassword, setShowPassword] = useState(false)

  const handleLogin = (e) => {
    e.preventDefault()
    alert('로그인 시도!')
  }

  return (
    <div className="login-container">
      <div className="login-card">
        <h2 className="login-title">로그인</h2>
        
        <form onSubmit={handleLogin}>
          <div className="input-group">
            <label className="input-label">이메일</label>
            <div className="input-wrapper">
              <HiOutlineMail className="input-icon" />
              <input 
                type="email" 
                placeholder="이메일 주소를 입력해 주세요." 
                className="input-field"
                required 
              />
            </div>
          </div>

          <div className="input-group">
            <label className="input-label">비밀번호</label>
            <div className="input-wrapper">
              <FaLock className="input-icon lock-icon" />
              <input 
                type={showPassword ? "text" : "password"} 
                placeholder="비밀번호를 입력해 주세요." 
                className="input-field"
                required 
              />
              <span className="eye-icon" onClick={() => setShowPassword(!showPassword)}>
                {showPassword ? <FiEye /> : <FiEyeOff />}
              </span>
            </div>
          </div>

          <div className="options-row">
            <label className="checkbox-label">
              <input type="checkbox" className="checkbox" />
              <span className="checkmark"></span>
              로그인 상태 유지
            </label>
            <span className="find-pw">비밀번호 찾기</span>
          </div>

          <button type="submit" className="submit-btn">
            로그인
          </button>
        </form>

        <hr className="divider" />

        <div className="footer-text">
          계정이 없으신가요?<span className="signup-link">회원가입</span>
        </div>
      </div>
    </div>
  )
}

export default App