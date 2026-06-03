import React, { useState } from 'react';
import { HiOutlineMail, HiEye, HiEyeOff } from 'react-icons/hi';
import { HiLockClosed } from 'react-icons/hi2'; 
import './Loginflow.css';

export default function Loginflow() {
  const [page, setPage] = useState(1);
  const [showPassword, setShowPassword] = useState(false);
  const [emailInput, setEmailInput] = useState('');
  const [keepLoggedIn, setKeepLoggedIn] = useState(false);

  const handleEmailChange = (e) => {
    setEmailInput(e.target.value);
  };

  return (
    <div className="flow-container">
      <div className="flow-card">
        
        {page === 1 && (
          <>
            <h2 className="flow-title">로그인</h2>
            <form onSubmit={(e) => { e.preventDefault(); setPage(2); }}>
              <div className="flow-group">
                <label className="flow-label">이메일</label>
                <div className="flow-wrapper">
                  <HiOutlineMail className="flow-icon" />
                  <input type="email" placeholder="이메일을 입력하세요" className="flow-field" required />
                </div>
              </div>
              <div className="flow-group">
                <label className="flow-label">비밀번호</label>
                <div className="flow-wrapper">
                  <HiLockClosed className="flow-icon" style={{left: '15px'}} />
                  <input type={showPassword ? "text" : "password"} placeholder="비밀번호를 입력하세요" className="flow-field" required />
                  <div className="flow-icon" style={{left: 'auto', right: '14px', cursor: 'pointer'}} onClick={() => setShowPassword(!showPassword)}>
                    {showPassword ? <HiEyeOff /> : <HiEye />}
                  </div>
                </div>
              </div>
              <div className="flow-options">
                <label className="flow-checkbox-label">
                  <input 
                    type="checkbox" 
                    className="flow-checkbox-hidden"
                    checked={keepLoggedIn}
                    onChange={() => setKeepLoggedIn(!keepLoggedIn)}
                  />
                  <span className="flow-custom-checkbox"></span>
                  <span className="flow-checkbox-text">로그인 상태 유지</span>
                </label>
                <span className="flow-link" onClick={() => { setPage(3); setEmailInput(''); }}>비밀번호 찾기</span>
              </div>
              <button type="submit" className="flow-btn-green">로그인</button>
            </form>
             <p className="flow-footer">계정이 없으신가요?<span className="flow-green-text" onClick={() => alert('회원가입 기능은 준비 중입니다.')}>회원가입</span></p>
          </>
        )}

        {page === 2 && (
          <>
            <h2 className="flow-title">로그인</h2>
              <form onSubmit={(e) => { e.preventDefault(); setPage(1); }}>
                <div className="flow-group">
                  <label className="flow-label">이메일</label>
                  <div className="flow-wrapper">
                    <HiOutlineMail className="flow-icon" />
                    <input type="email" defaultValue="dkanrjsk@gmail.com" className="flow-field" required />
                  </div>
                </div>
                <div className="flow-group">
                  <label className="flow-label">비밀번호</label>
                  <div className="flow-wrapper">
                    <HiLockClosed className="flow-icon" style={{left: '15px'}} />
                    <input type="password" defaultValue="********" className="flow-field" required />
                    <div className="flow-icon" style={{left: 'auto', right: '14px'}}><HiEye /></div>
                  </div>
                </div>
                <div className="flow-options">
                  <label className="flow-checkbox-label">
                    <input 
                      type="checkbox" 
                      className="flow-checkbox-hidden"
                      checked={keepLoggedIn}
                      onChange={() => setKeepLoggedIn(!keepLoggedIn)}
                    />
                    <span className="flow-custom-checkbox"></span>
                    <span className="flow-checkbox-text">로그인 상태 유지</span>
                  </label>
                  <span className="flow-link" onClick={() => { setPage(3); setEmailInput(''); }}>비밀번호 찾기</span>
                </div>
                <p className="flow-error">아이디 또는 비밀번호가 일치하지 않습니다.</p>
                <button type="submit" className="flow-btn-green">로그인</button>
              </form>
              <p className="flow-footer">계정이 없으신가요?<span className="flow-green-text" onClick={() => setPage(1)}>회원가입</span></p>
            </>
          )}

        {page === 3 && (
          <>
            <h2 className="flow-title">비밀번호 찾기</h2>
            <form onSubmit={(e) => { e.preventDefault(); alert('이메일 발송 완료!'); setPage(1); }}>
              <div className="flow-group">
                <label className="flow-label">이메일</label>
                <div className="flow-wrapper">
                  <HiOutlineMail className="flow-icon" />
                  <input 
                    type="text" 
                    placeholder="이메일을 입력하세요" 
                    className="flow-field" 
                    value={emailInput}
                    onChange={handleEmailChange}
                    required 
                  />
                </div>
              </div>
              <button 
                type="submit" 
                className={emailInput.trim() === '' ? "flow-btn-gray" : "flow-btn-green"} 
                disabled={emailInput.trim() === ''}
                style={{ cursor: emailInput.trim() === '' ? 'not-allowed' : 'pointer' }}
              >
                이메일 보내기
              </button>
              <div className="flow-divider"><span className="flow-div-text">또는</span></div>
              <button type="button" className="flow-btn-white" onClick={() => setPage(1)}>로그인 페이지로 돌아가기</button>
            </form>
          </>
        )}

      </div>
    </div>
  );
}