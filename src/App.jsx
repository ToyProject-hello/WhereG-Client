import "./App.css";

import { FaRegUser } from "react-icons/fa";
import { HiOutlineMail } from "react-icons/hi";
import { useState, useEffect, useRef } from "react";

import {
  FiChevronLeft,
  FiEye,
  FiEyeOff,
  FiChevronDown,
  FiChevronUp,
} from "react-icons/fi";

import { GoCheckCircle } from "react-icons/go";

function App() {
  const [page, setPage] = useState("signup");
  const inputRefs = useRef([]);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] =
    useState("");

  const [showPassword, setShowPassword] =
    useState(false);

  const [showPasswordConfirm, setShowPasswordConfirm] =
    useState(false);

  const [department, setDepartment] =
    useState("");

  const [generation, setGeneration] =
    useState("");

  const [showDepartment, setShowDepartment] =
    useState(false);

  const [showGeneration, setShowGeneration] =
    useState(false);

  const [code1, setCode1] = useState("");
  const [code2, setCode2] = useState("");
  const [code3, setCode3] = useState("");
  const [code4, setCode4] = useState("");
  const [code5, setCode5] = useState("");
  const [code6, setCode6] = useState("");

  const [time, setTime] = useState(300);

  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] =
    useState("");

  const isSignup = name !== "" && email !== "";

  const isCode =
    code1 !== "" &&
    code2 !== "" &&
    code3 !== "" &&
    code4 !== "" &&
    code5 !== "" &&
    code6 !== "" &&
    time > 0;

  const isPassword =
    password !== "" &&
    passwordConfirm !== "";

  useEffect(() => {
    if (page !== "verify") return;

    setCode1(""); setCode2(""); setCode3("");
    setCode4(""); setCode5(""); setCode6("");
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

  const minute = String(Math.floor(time / 60)).padStart(
    2,
    "0"
  );

  const second = String(time % 60).padStart(
    2,
    "0"
  );

  function resendEmail() {
  setTime(300);
  setCode1(""); setCode2(""); setCode3("");
  setCode4(""); setCode5(""); setCode6("");
}

  function signupNext() {
    if (!email.includes("@")) {
      setEmailError(
        "올바른 이메일 형식이 아닙니다."
      );
      return;
    }

    if (email === "test@test.com") {
      setEmailError(
        "이미 사용 중인 이메일입니다."
      );
      return;
    }

    setEmailError("");
    setPage("verify");
  }

  function finishVerification() {
    if (isCode) {
      setPage("password");
    }
  }

  function passwordNext() {
    if (password.length < 8) {
      setPasswordError(
        "비밀번호는 8자 이상이어야 합니다."
      );
      return;
    }

    if (password !== passwordConfirm) {
      setPasswordError(
        "비밀번호가 일치하지 않습니다."
      );
      return;
    }

    setPasswordError("");
    setPage("profile");
  }

  return (
    <div className="app">
      {page === "signup" && (
        <div className="signup-card">
          <div className="top-area">
            <div className="back-btn" onClick={() => {/* 로그인 페이지 이동 등 뒤로가기 동작 정의 */}}>
              <FiChevronLeft />
            </div>

            <h1 className="title">회원가입</h1>

            <p className="subtitle">
              기본 정보를 입력해 주세요.
            </p>
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
                  onChange={(e) =>
                    setName(e.target.value)
                  }
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
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setEmailError("");
                  }}
                />
              </div>

              {emailError !== "" && (
                <p className="error-text">
                  {emailError}
                </p>
              )}
            </div>
          </div>

          <button
            className={
              isSignup
                ? "next-btn active"
                : "next-btn"
            }
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
            <div
              className="back-btn"
              onClick={() => setPage("signup")}
            >
              <FiChevronLeft />
            </div>

            <h1 className="title">이메일 인증</h1>

            <p className="subtitle">
              입력하신 이메일로 인증코드를
              발송했습니다.
              <br />
              이메일을 확인하고 인증코드를
              입력해 주세요.
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
                ref={(el) => (inputRefs.current[index] = el)}
                onChange={(e) => {
                  const value = e.target.value;
                  if (!/^[0-9]?$/.test(value)) return;

                  const setCodes = [setCode1, setCode2, setCode3, setCode4, setCode5, setCode6];
                  setCodes[index](value);

                  if (value && index < 5) {
                    inputRefs.current[index + 1]?.focus();
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === "Backspace" && !code && index > 0) {
                    const setCodes = [setCode1, setCode2, setCode3, setCode4, setCode5, setCode6];
                    setCodes[index - 1]("");
                    inputRefs.current[index - 1]?.focus();
                  }
                }}
              />
            ))}
          </div>

          <div className="timer-row">
            <span>
              인증코드는 5분간 유효합니다.
            </span>

            <span className="timer">
              {minute}:{second}
            </span>
          </div>

          <div className="resend-row">
            <span>
              이메일을 받지 못하셨나요?
            </span>

            <button
              className="resend-btn"
              onClick={resendEmail}
            >
              재발송
            </button>
          </div>

          <button
            className={
              isCode
                ? "next-btn active"
                : "next-btn"
            }
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
            <div
              className="back-btn"
              onClick={() => setPage("verify")}
            >
              <FiChevronLeft />
            </div>

            <h1 className="title">회원가입</h1>

            <p className="subtitle">
              기본 정보를 입력해 주세요.
            </p>
          </div>

          <div className="form-area">
            <div className="input-group">
              <label>비밀번호</label>

              <div className="input-box password-input">
                <input
                  type={
                    showPassword
                      ? "text"
                      : "password"
                  }
                  placeholder="비밀번호를 입력해 주세요."
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setPasswordError("");
                  }}
                />

                <button
                  type="button"
                  className="eye-btn"
                  onClick={() =>
                    setShowPassword(!showPassword)
                  }
                >
                  {showPassword ? (
                    <FiEye size={22} />
                  ) : (
                    <FiEyeOff size={22} />
                  )}
                </button>
              </div>
            </div>

            <div className="input-group">
              <label>비밀번호 확인</label>

              <div className="input-box password-input">
                <input
                  type={
                    showPasswordConfirm
                      ? "text"
                      : "password"
                  }
                  placeholder="비밀번호를 한 번 더 입력해 주세요."
                  value={passwordConfirm}
                  onChange={(e) => {
                    setPasswordConfirm(
                      e.target.value
                    );
                    setPasswordError("");
                  }}
                />

                <button
                  type="button"
                  className="eye-btn"
                  onClick={() =>
                    setShowPasswordConfirm(
                      !showPasswordConfirm
                    )
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
                <p className="error-text">
                  {passwordError}
                </p>
              )}
            </div>
          </div>

          <div className="button-group">
            <button
              className="next-btn"
              onClick={() => setPage("verify")}
            >
              이전
            </button>

            <button
              className={
                isPassword
                  ? "next-btn active"
                  : "next-btn"
              }
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
            <div
              className="back-btn"
              onClick={() => setPage("password")}
            >
              <FiChevronLeft />
            </div>

            <h1 className="title">회원가입</h1>

            <p className="subtitle">
              기본 정보를 입력해 주세요.
            </p>
          </div>

          <div className="form-area">
            <div className="input-group">
              <label>학과</label>

              <div className="select-wrapper">
                <button
                  type="button"
                  className={`select-box ${department ? "selected" : ""}`}
                  onClick={() =>
                    setShowDepartment(
                      !showDepartment
                    )
                  }
                >
                  <span>
                    {department ||
                      "학과를 선택해주세요."}
                  </span>

                  {showDepartment ? (
                    <FiChevronUp size={22} />
                  ) : (
                    <FiChevronDown size={22} />
                  )}
                </button>

                {showDepartment && (
                  <div className="dropdown">
                    {[
                      "소프트웨어개발과",
                      "스마트IoT과",
                      "AI과",
                    ].map((item) => (
                      <div
                        key={item}
                        className={`dropdown-item ${
                          department === item
                            ? "active"
                            : ""
                        }`}
                        onClick={() => {
                          setDepartment(item);
                          setShowDepartment(
                            false
                          );
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
                  onClick={() =>
                    setShowGeneration(
                      !showGeneration
                    )
                  }
                >
                  <span>
                    {generation ||
                      "기수를 선택해주세요."}
                  </span>

                  {showGeneration ? (
                    <FiChevronUp size={22} />
                  ) : (
                    <FiChevronDown size={22} />
                  )}
                </button>

                {showGeneration && (
                  <div className="dropdown">
                    {[
                      "8기",
                      "9기",
                      "10기",
                    ].map((item) => (
                      <div
                        key={item}
                        className={`dropdown-item ${
                          generation === item
                            ? "active"
                            : ""
                        }`}
                        onClick={() => {
                          setGeneration(item);
                          setShowGeneration(
                            false
                          );
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
            <button
              className="next-btn"
              onClick={() => setPage("password")}
            >
              이전
            </button>

            <button
              className={
                department !== "" &&
                generation !== ""
                  ? "next-btn active"
                  : "next-btn"
              }
              disabled={
                department === "" ||
                generation === ""
              }
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
              onClick={() => setPage("signup")}
              aria-label="닫기"
            >
              ×
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

            <button
              className="next-btn active"
              onClick={() => setPage("signup")}
            >
              로그인 하러 가기
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;