import logo from './logo.svg';
import './App.css';

function App() {
  return (
    <div className="app">

      <div className="signup-card">

        <div className="top-area">

          <div className="back-btn">‹</div>

          <h1 className="title">회원가입</h1>

          <p className="subtitle">
            기본 정보를 입력해 주세요.
          </p>

        </div>

        <div className="form-area">

          <div className="input-group">

            <label>이름</label>

            <div className="input-box">

              <span className="icon">👤</span>

              <input
                type="text"
                placeholder="이름을 입력해 주세요."
              />

            </div>

          </div>

          <div className="input-group">

            <label>이메일</label>

            <div className="input-box">

              <span className="icon">✉</span>

              <input
                type="email"
                placeholder="이메일 주소를 입력해 주세요."
              />

            </div>

          </div>

        </div>

        <button className="next-btn">
          다음
        </button>

      </div>

    </div>
  );
}

export default App;
