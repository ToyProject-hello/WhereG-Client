import "./App.css";
import { useState, useEffect } from "react";

import { FaRegUser } from "react-icons/fa";
import { HiOutlineMail } from "react-icons/hi";
import { FiChevronLeft } from "react-icons/fi";

function App() {
  const [page, setPage] = useState("signup");

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  const [code1, setCode1] = useState("");
  const [code2, setCode2] = useState("");
  const [code3, setCode3] = useState("");
  const [code4, setCode4] = useState("");
  const [code5, setCode5] = useState("");
  const [code6, setCode6] = useState("");

  const [time, setTime] = useState(300);

  const [emailError, setEmailError] = useState("");

  const isSignup = name !== "" && email !== "";

  const isCode =
    code1 !== "" &&
    code2 !== "" &&
    code3 !== "" &&
    code4 !== "" &&
    code5 !== "" &&
    code6 !== "";

  useEffect(() => {
    if (page !== "verify") return;

    const timer = setInterval(() => {
      setTime((prev) => {
        if (prev <= 0) {
          clearInterval(timer);
          return 0;
        }

        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [page]);

  const minute = String(Math.floor(time / 60)).padStart(2, "0");
  const second = String(time % 60).padStart(2, "0");

  function resendEmail() {
    setTime(300);
  }

  function signupNext() {
    if (!email.includes("@")) {
      setEmailError("올바른 이메일 형식이 아닙니다.");
      return;
    }

    if (email === "test@test.com") {
      setEmailError("이미 사용 중인 이메일입니다.");
      return;
    }

    setEmailError("");
    setPage("verify");
  }

  return (
    <div className="app">
      {page === "signup" && (
        <div className="signup-card">
          <div className="top-area">
            <div className="back-btn">
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
                  onChange={(e) => setName(e.target.value)}
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
            className={isSignup ? "next-btn active" : "next-btn"}
            disabled={!isSignup}
            onClick={signupNext}
          >
            <span>다음</span>
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
              입력하신 이메일로 인증코드를 발송했습니다.
              <br />
              이메일을 확인하고 인증코드를 입력해 주세요.
            </p>
          </div>

          <div className="email-info">
            <HiOutlineMail size={20} />

            <span>
              인증코드가 입력하신 이메일로 발송되었습니다.
            </span>
          </div>

          <div className="code-inputs">
            <input
              id="code1"
              maxLength={1}
              value={code1}
              onChange={(e) => {
                const value = e.target.value;

                if (!/^[0-9]?$/.test(value)) return;

                setCode1(value);

                if (value !== "") {
                  document.getElementById("code2").focus();
                }
              }}
            />

            <input
              id="code2"
              maxLength={1}
              value={code2}
              onChange={(e) => {
                const value = e.target.value;

                if (!/^[0-9]?$/.test(value)) return;

                setCode2(value);

                if (value !== "") {
                  document.getElementById("code3").focus();
                }
              }}
            />

            <input
              id="code3"
              maxLength={1}
              value={code3}
              onChange={(e) => {
                const value = e.target.value;

                if (!/^[0-9]?$/.test(value)) return;

                setCode3(value);

                if (value !== "") {
                  document.getElementById("code4").focus();
                }
              }}
            />

            <input
              id="code4"
              maxLength={1}
              value={code4}
              onChange={(e) => {
                const value = e.target.value;

                if (!/^[0-9]?$/.test(value)) return;

                setCode4(value);

                if (value !== "") {
                  document.getElementById("code5").focus();
                }
              }}
            />

            <input
              id="code5"
              maxLength={1}
              value={code5}
              onChange={(e) => {
                const value = e.target.value;

                if (!/^[0-9]?$/.test(value)) return;

                setCode5(value);

                if (value !== "") {
                  document.getElementById("code6").focus();
                }
              }}
            />

            <input
              id="code6"
              maxLength={1}
              value={code6}
              onChange={(e) => {
                const value = e.target.value;

                if (!/^[0-9]?$/.test(value)) return;

                setCode6(value);
              }}
            />
          </div>

          <div className="timer-row">
            <span>인증코드는 5분간 유효합니다.</span>

            <span className="timer">
              {minute}:{second}
            </span>
          </div>

          <div className="resend-row">
            <span>이메일을 받지 못하셨나요?</span>

            <button
              className="resend-btn"
              onClick={resendEmail}
            >
              재발송
            </button>
          </div>

          <button
            className={isCode ? "next-btn active" : "next-btn"}
            disabled={!isCode}
          >
            <span>인증하기</span>
          </button>
        </div>
      )}
    </div>
  );
}

export default App;