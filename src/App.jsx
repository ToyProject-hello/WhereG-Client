import "./App.css";
import HomeApp from "../src copy/App.jsx";

import { FaLock, FaRegUser } from "react-icons/fa";
import { HiOutlineMail } from "react-icons/hi";
import { useEffect, useRef, useState } from "react";

import {
  FiChevronLeft,
  FiChevronDown,
  FiChevronUp,
  FiEye,
  FiEyeOff,
} from "react-icons/fi";

import { GoCheckCircle } from "react-icons/go";

const ACCOUNT_KEY = "wg_accounts";
const USER_KEY = "wg_user";

function readAccounts() {
  try {
    const raw = localStorage.getItem(ACCOUNT_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function writeAccounts(accounts) {
  try {
    localStorage.setItem(ACCOUNT_KEY, JSON.stringify(accounts));
  } catch {
    // 저장소를 사용할 수 없어도 현재 화면 흐름은 유지합니다.
  }
}

function normalizeEmail(value) {
  return value.trim().toLowerCase();
}

function saveAccount(account) {
  const accounts = readAccounts();
  accounts[account.email] = account;
  writeAccounts(accounts);
}

function rememberUser(account, remember) {
  try {
    const value = JSON.stringify(account.name || account.email);
    if (remember) {
      localStorage.setItem(USER_KEY, value);
    } else {
      sessionStorage.setItem(USER_KEY, value);
      localStorage.removeItem(USER_KEY);
    }
  } catch {
  }
}

function LoginPage({ onBackHome, onForgotPassword, onLoginSuccess, onSignup }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);
  const [error, setError] = useState("");

  const canLogin = email.trim() !== "" && password !== "";

  function handleSubmit(event) {
    event.preventDefault();

    const account = readAccounts()[normalizeEmail(email)];

    if (!account || account.password !== password) {
      setError("아이디 또는 비밀번호가 일치하지 않습니다.");
      return;
    }

    rememberUser(account);
    onLoginSuccess(account, remember);
  }

  return (
    <div className="auth-page">
      <form className="auth-card login-card" onSubmit={handleSubmit}>
        <button
          type="button"
          className="auth-back-btn"
          aria-label="홈으로 돌아가기"
          onClick={onBackHome}
        >
          <FiChevronLeft />
        </button>

        <h1 className="auth-title">로그인</h1>

        <div className="auth-form">
          <div className="auth-field">
            <label>이메일</label>
            <div className="auth-input-box">
              <HiOutlineMail className="auth-input-icon" size={23} />
              <input
                type="email"
                placeholder="이메일 주소를 입력해 주세요."
                value={email}
                onChange={(event) => {
                  setEmail(event.target.value);
                  setError("");
                }}
              />
            </div>
          </div>

          <div className="auth-field">
            <label>비밀번호</label>
            <div className="auth-input-box">
              <FaLock className="auth-input-icon auth-lock-icon" size={17} />
              <input
                type={showPassword ? "text" : "password"}
                placeholder="비밀번호를 입력해 주세요."
                value={password}
                onChange={(event) => {
                  setPassword(event.target.value);
                  setError("");
                }}
              />
              <button
                type="button"
                className="auth-eye-btn"
                aria-label={showPassword ? "비밀번호 숨기기" : "비밀번호 보기"}
                onClick={() => setShowPassword((current) => !current)}
              >
                {showPassword ? <FiEye size={21} /> : <FiEyeOff size={21} />}
              </button>
            </div>
          </div>

          <div className="login-options">
            <label className="remember-control">
              <input
                type="checkbox"
                checked={remember}
                onChange={(event) => setRemember(event.target.checked)}
              />
              <span>로그인 상태 유지</span>
            </label>

            <button
              type="button"
              className="plain-link"
              onClick={onForgotPassword}
            >
              비밀번호 찾기
            </button>
          </div>

          {error && <p className="login-error">{error}</p>}

          <button
            type="submit"
            className={`auth-primary-btn ${canLogin ? "active" : ""}`}
            disabled={!canLogin}
          >
            로그인
          </button>
        </div>

        <div className="auth-divider" />

        <p className="auth-bottom-text">
          계정이 없으신가요?
          <button type="button" className="auth-text-link" onClick={onSignup}>
            회원가입
          </button>
        </p>
      </form>
    </div>
  );
}

function ForgotPasswordPage({ onBackToLogin }) {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const canSend = email.trim() !== "";

  function handleSubmit(event) {
    event.preventDefault();
    if (!canSend) return;
    setMessage("비밀번호 재설정 메일을 보냈습니다.");
  }

  return (
    <div className="auth-page">
      <form className="auth-card forgot-card" onSubmit={handleSubmit}>
        <h1 className="auth-title">비밀번호 찾기</h1>

        <div className="auth-form">
          <div className="auth-field">
            <label>이메일</label>
            <div className="auth-input-box">
              <HiOutlineMail className="auth-input-icon" size={23} />
              <input
                type="email"
                placeholder="이메일 주소를 입력해 주세요."
                value={email}
                onChange={(event) => {
                  setEmail(event.target.value);
                  setMessage("");
                }}
              />
            </div>
          </div>

          {message && <p className="auth-success-text">{message}</p>}

          <button
            type="submit"
            className={`auth-primary-btn ${canSend ? "active" : ""}`}
            disabled={!canSend}
          >
            이메일 보내기
          </button>
        </div>

        <div className="or-divider">
          <span />
          <strong>또는</strong>
          <span />
        </div>

        <button
          type="button"
          className="auth-outline-btn"
          onClick={onBackToLogin}
        >
          로그인 페이지로 돌아가기
        </button>
      </form>
    </div>
  );
}

function SignupFlow({ onBackToLogin, onComplete }) {
  const [page, setPage] = useState("signup");
  const inputRefs = useRef([]);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);

  const [department, setDepartment] = useState("");
  const [generation, setGeneration] = useState("");

  const [showDepartment, setShowDepartment] = useState(false);
  const [showGeneration, setShowGeneration] = useState(false);

  const [code1, setCode1] = useState("");
  const [code2, setCode2] = useState("");
  const [code3, setCode3] = useState("");
  const [code4, setCode4] = useState("");
  const [code5, setCode5] = useState("");
  const [code6, setCode6] = useState("");

  const [time, setTime] = useState(300);

  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");

  const isSignup = name.trim() !== "" && email.trim() !== "";

  const isCode =
    code1 !== "" &&
    code2 !== "" &&
    code3 !== "" &&
    code4 !== "" &&
    code5 !== "" &&
    code6 !== "" &&
    time > 0;

  const isPassword = password !== "" && passwordConfirm !== "";

  useEffect(() => {
    if (page !== "verify") return;

    setCode1("");
    setCode2("");
    setCode3("");
    setCode4("");
    setCode5("");
    setCode6("");
    setTime(300);

    const timer = setInterval(() => {
      setTime((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [page]);

  useEffect(() => {
    if (page === "password") {
      setPassword("");
      setPasswordConfirm("");
      setPasswordError("");
      setShowPassword(false);
      setShowPasswordConfirm(false);
    }
  }, [page]);

  const minute = String(Math.floor(time / 60)).padStart(2, "0");
  const second = String(time % 60).padStart(2, "0");

  function resendEmail() {
    setTime(300);
    setCode1("");
    setCode2("");
    setCode3("");
    setCode4("");
    setCode5("");
    setCode6("");
  }

  function signupNext() {
    const normalizedEmail = normalizeEmail(email);

    if (!normalizedEmail.includes("@")) {
      setEmailError("올바른 이메일 형식이 아닙니다.");
      return;
    }

    if (readAccounts()[normalizedEmail]) {
      setEmailError("이미 사용 중인 이메일입니다.");
      return;
    }

    setEmailError("");
    setEmail(normalizedEmail);
    setPage("verify");
  }

  function finishVerification() {
    if (isCode) {
      setPage("password");
    }
  }

  function passwordNext() {
    if (password.length < 8) {
      setPasswordError("비밀번호는 8자 이상이어야 합니다.");
      return;
    }

    if (password !== passwordConfirm) {
      setPasswordError("비밀번호가 일치하지 않습니다.");
      return;
    }

    setPasswordError("");
    setPage("profile");
  }

  function finishSignup() {
  const account = {
    name: name.trim(),
    email: normalizeEmail(email),
    password,
    department,
    generation,
  };

  saveAccount(account);
  onComplete();
}

  return (
    <div className="app">
      {page === "signup" && (
        <div className="signup-card">
          <div className="top-area">
            <button
              type="button"
              className="back-btn"
              onClick={onBackToLogin}
              aria-label="로그인으로 돌아가기"
            >
              <FiChevronLeft />
            </button>

            <h1 className="title">회원가입</h1>

            <p className="subtitle">기본 정보를 입력해 주세요.</p>
          </div>

          <div className="form-area">
            <div className="input-group">
              <label>이름</label>

              <div className="input-box">
                <span className="icon">
                  <FaRegUser size={20} />
                </span>

                <input
                  type="text"
                  placeholder="이름을 입력해 주세요."
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                />
              </div>
            </div>

            <div className="input-group">
              <label>이메일</label>

              <div className="input-box">
                <span className="icon">
                  <HiOutlineMail size={22} />
                </span>

                <input
                  type="email"
                  placeholder="이메일 주소를 입력해 주세요."
                  value={email}
                  onChange={(event) => {
                    setEmail(event.target.value);
                    setEmailError("");
                  }}
                />
              </div>

              {emailError !== "" && <p className="error-text">{emailError}</p>}
            </div>
          </div>

          <button
            className={isSignup ? "next-btn active" : "next-btn"}
            disabled={!isSignup}
            onClick={signupNext}
          >
            다음
          </button>
        </div>
      )}

      {page === "verify" && (
        <div className="signup-card verify-card">
          <div className="top-area">
            <button
              type="button"
              className="back-btn"
              onClick={() => setPage("signup")}
              aria-label="이전 단계"
            >
              <FiChevronLeft />
            </button>

            <h1 className="title">이메일 인증</h1>

            <p className="subtitle">
              입력하신 이메일로 인증코드를 발송했습니다.
              <br />
              이메일을 확인하고 인증코드를 입력해 주세요.
            </p>
          </div>

          <div className="email-info">
            <HiOutlineMail size={20} />

            <span>
              인증코드가 <span className="email-highlight">{email}</span>로
              발송되었습니다.
            </span>
          </div>

          <div className="code-inputs">
            {[code1, code2, code3, code4, code5, code6].map((code, index) => (
              <input
                key={index}
                id={`code${index + 1}`}
                maxLength={1}
                value={code}
                ref={(el) => {
                  inputRefs.current[index] = el;
                }}
                onChange={(event) => {
                  const value = event.target.value;
                  if (!/^[0-9]?$/.test(value)) return;

                  const setCodes = [
                    setCode1,
                    setCode2,
                    setCode3,
                    setCode4,
                    setCode5,
                    setCode6,
                  ];
                  setCodes[index](value);

                  if (value && index < 5) {
                    inputRefs.current[index + 1]?.focus();
                  }
                }}
                onKeyDown={(event) => {
                  if (event.key === "Backspace" && !code && index > 0) {
                    const setCodes = [
                      setCode1,
                      setCode2,
                      setCode3,
                      setCode4,
                      setCode5,
                      setCode6,
                    ];
                    setCodes[index - 1]("");
                    inputRefs.current[index - 1]?.focus();
                  }
                }}
              />
            ))}
          </div>

          <div className="timer-row">
            <span>인증코드는 5분간 유효합니다.</span>
            <span className="timer">
              {minute}:{second}
            </span>
          </div>

          <div className="resend-row">
            <span>이메일을 받지 못하셨나요?</span>

            <button className="resend-btn" onClick={resendEmail}>
              재발송
            </button>
          </div>

          <button
            className={isCode ? "next-btn active" : "next-btn"}
            disabled={!isCode}
            onClick={finishVerification}
          >
            인증하기
          </button>
        </div>
      )}

      {page === "password" && (
        <div className="signup-card password-card">
          <div className="top-area">
            <button
              type="button"
              className="back-btn"
              onClick={() => setPage("verify")}
              aria-label="이전 단계"
            >
              <FiChevronLeft />
            </button>

            <h1 className="title">회원가입</h1>

            <p className="subtitle">기본 정보를 입력해 주세요.</p>
          </div>

          <div className="form-area">
            <div className="input-group">
              <label>비밀번호</label>

              <div className="input-box password-input">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="비밀번호를 입력해 주세요."
                  value={password}
                  onChange={(event) => {
                    setPassword(event.target.value);
                    setPasswordError("");
                  }}
                />

                <button
                  type="button"
                  className="eye-btn"
                  aria-label={showPassword ? "비밀번호 숨기기" : "비밀번호 보기"}
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <FiEye size={22} /> : <FiEyeOff size={22} />}
                </button>
              </div>
            </div>

            <div className="input-group">
              <label>비밀번호 확인</label>

              <div className="input-box password-input">
                <input
                  type={showPasswordConfirm ? "text" : "password"}
                  placeholder="비밀번호를 한 번 더 입력해 주세요."
                  value={passwordConfirm}
                  onChange={(event) => {
                    setPasswordConfirm(event.target.value);
                    setPasswordError("");
                  }}
                />

                <button
                  type="button"
                  className="eye-btn"
                  aria-label={
                    showPasswordConfirm ? "비밀번호 숨기기" : "비밀번호 보기"
                  }
                  onClick={() =>
                    setShowPasswordConfirm(!showPasswordConfirm)
                  }
                >
                  {showPasswordConfirm ? (
                    <FiEye size={22} />
                  ) : (
                    <FiEyeOff size={22} />
                  )}
                </button>
              </div>

              {passwordError !== "" && (
                <p className="error-text">{passwordError}</p>
              )}
            </div>
          </div>

          <div className="button-group">
            <button className="next-btn" onClick={() => setPage("verify")}>
              이전
            </button>

            <button
              className={isPassword ? "next-btn active" : "next-btn"}
              disabled={!isPassword}
              onClick={passwordNext}
            >
              다음
            </button>
          </div>
        </div>
      )}

      {page === "profile" && (
        <div className="signup-card">
          <div className="top-area">
            <button
              type="button"
              className="back-btn"
              onClick={() => setPage("password")}
              aria-label="이전 단계"
            >
              <FiChevronLeft />
            </button>

            <h1 className="title">회원가입</h1>

            <p className="subtitle">기본 정보를 입력해 주세요.</p>
          </div>

          <div className="form-area">
            <div className="input-group">
              <label>학과</label>

              <div className="select-wrapper">
                <button
                  type="button"
                  className={`select-box ${department ? "selected" : ""}`}
                  onClick={() => setShowDepartment(!showDepartment)}
                >
                  <span>{department || "학과를 선택해주세요."}</span>

                  {showDepartment ? (
                    <FiChevronUp size={22} />
                  ) : (
                    <FiChevronDown size={22} />
                  )}
                </button>

                {showDepartment && (
                  <div className="dropdown">
                    {["소프트웨어개발과", "스마트IoT과", "AI과"].map((item) => (
                      <div
                        key={item}
                        className={`dropdown-item ${
                          department === item ? "active" : ""
                        }`}
                        onClick={() => {
                          setDepartment(item);
                          setShowDepartment(false);
                        }}
                      >
                        {item}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="input-group">
              <label>기수</label>

              <div className="select-wrapper">
                <button
                  type="button"
                  className={`select-box ${generation ? "selected" : ""}`}
                  onClick={() => setShowGeneration(!showGeneration)}
                >
                  <span>{generation || "기수를 선택해주세요."}</span>

                  {showGeneration ? (
                    <FiChevronUp size={22} />
                  ) : (
                    <FiChevronDown size={22} />
                  )}
                </button>

                {showGeneration && (
                  <div className="dropdown">
                    {["8기", "9기", "10기"].map((item) => (
                      <div
                        key={item}
                        className={`dropdown-item ${
                          generation === item ? "active" : ""
                        }`}
                        onClick={() => {
                          setGeneration(item);
                          setShowGeneration(false);
                        }}
                      >
                        {item}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="button-group">
            <button className="next-btn" onClick={() => setPage("password")}>
              이전
            </button>

            <button
              className={
                department !== "" && generation !== ""
                  ? "next-btn active"
                  : "next-btn"
              }
              disabled={department === "" || generation === ""}
              onClick={() => setPage("complete")}
            >
              회원가입
            </button>
          </div>
        </div>
      )}

      {page === "complete" && (
        <div className="overlay">
          <div className="complete-modal">
            <button
              className="close-icon"
              onClick={finishSignup}
              aria-label="닫기"
            >
              x
            </button>

            <div className="complete-icon">
              <GoCheckCircle size={84} />
            </div>

            <h1>회원가입 완료</h1>
            <p className="complete-message">
              {name ? (
                <>
                  <span className="name-highlight">{name}</span>
                  님 회원가입이 완료되었습니다.
                </>
              ) : (
                "회원가입이 완료되었습니다"
              )}
            </p>
            <p className="complete-subtext">
              로그인 후 서비스를 이용해 주세요.
            </p>

            <button className="next-btn active" onClick={finishSignup}>
              로그인하러 가기
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function App() {
  const [authView, setAuthView] = useState("home");
  const [homeKey, setHomeKey] = useState(0);

  function returnHome() {
    setAuthView("home");
    setHomeKey((key) => key + 1);
  }

  if (authView === "login") {
    return (
      <LoginPage
        onBackHome={returnHome}
        onForgotPassword={() => setAuthView("forgot")}
        onLoginSuccess={returnHome}
        onSignup={() => setAuthView("signup")}
      />
    );
  }

  if (authView === "forgot") {
    return <ForgotPasswordPage onBackToLogin={() => setAuthView("login")} />;
  }

  if (authView === "signup") {
    return (
      <SignupFlow
      onBackToLogin={() => setAuthView("login")}
      onComplete={() => setAuthView("login")}
    />
    );
  }

  return <HomeApp key={homeKey} onAuthNavigate={setAuthView} />;
}
