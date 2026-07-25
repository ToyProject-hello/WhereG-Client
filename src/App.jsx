import "./App.css";
import HomeApp from "../src home/App.jsx";
import axios from "axios";

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

const USER_KEY = "wg_user";
// USER_KEY("wg_user")는 "로그인 상태 유지"용으로 이메일을 저장하는 키인데,
// HomeApp(src home)이 같은 키 이름을 "화면에 보여줄 사용자 이름"으로 착각해서
// 그대로 읽어 쓰고 있었습니다. 그래서 헤더/작성자 표시에 이메일이 나왔던 것.
// 이름은 이 별도 키에 저장해서 완전히 분리합니다.
const USER_NAME_KEY = "wg_user_name";

const ACCESS_TOKEN_KEY = "wg_access_token";
const REFRESH_TOKEN_KEY = "wg_refresh_token";
const ACCESS_EXPIRES_KEY = "wg_access_expires_at";
const REFRESH_EXPIRES_KEY = "wg_refresh_expires_at";

const API_BASE_URL = import.meta.env.VITE_API_URL || "https://whereg.site";

// 학과 UI 라벨 -> 백엔드 enum 값 매핑
// 주의: 백엔드는 SW / IOT / AI 세 값만 허용합니다. ("스마트IoT과"는 IOT로 매핑)
const DEPARTMENT_OPTIONS = [
  { label: "소프트웨어개발과", value: "SW" },
  { label: "스마트IoT과", value: "IOT" },
  { label: "AI과", value: "AI" },
];

// 학년(grade) - 백엔드가 실제로 갖고 있는 필드입니다. ("기수"는 백엔드에 없음)
const GRADE_OPTIONS = [
  { label: "1학년", value: 1 },
  { label: "2학년", value: 2 },
  { label: "3학년", value: 3 }
];

function normalizeEmail(value) {
  return value.trim().toLowerCase();
}

// ---- 토큰 저장/조회 --------------------------------------------------------
function saveTokens({
  accessToken,
  refreshToken,
  accessTokenExpiresIn,
  refreshTokenExpiresIn,
}) {
  const now = Date.now();
  try {
    if (accessToken) {
      localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
    }

    if (refreshToken) {
      localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
    }
    if (accessTokenExpiresIn) {
      localStorage.setItem(
        ACCESS_EXPIRES_KEY,
        String(now + accessTokenExpiresIn * 1000)
      );
    }
    if (refreshTokenExpiresIn) {
      localStorage.setItem(
        REFRESH_EXPIRES_KEY,
        String(now + refreshTokenExpiresIn * 1000)
      );
    }
  } catch {
    // 저장소를 사용할 수 없어도 현재 화면 흐름은 유지합니다.
  }
}

function getAccessToken() {
  try {
    return localStorage.getItem(ACCESS_TOKEN_KEY);
  } catch {
    return null;
  }
}

function getRefreshToken() {
  try {
    return localStorage.getItem(REFRESH_TOKEN_KEY);
  } catch {
    return null;
  }
}

function clearTokens() {
  try {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(ACCESS_EXPIRES_KEY);
    localStorage.removeItem(REFRESH_EXPIRES_KEY);
  } catch {
    // ignore
  }
}

// ---- axios 인스턴스: Authorization 헤더 자동 부착 + 401시 토큰 재발급 -------
const api = axios.create({ baseURL: API_BASE_URL });

// ---- 로그인 전에 쓰는 "공개" API 전용 인스턴스 ------------------------------
// 회원가입, 이메일 인증번호 발급/확인 같은 API는 토큰이 필요 없는데,
// 위 `api` 인스턴스를 그대로 쓰면 브라우저에 남아있는 만료/무효 토큰이
// 실수로 붙어서 401 -> 재발급 실패 -> 강제 새로고침으로 이어질 수 있습니다.
// (회원가입 인증메일이 "조용히" 안 가는 것처럼 보였던 원인)
// 그래서 이런 공개 API는 인터셉터가 없는 별도 인스턴스로 호출합니다.
const publicApi = axios.create({ baseURL: API_BASE_URL });

api.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

let reissuePromise = null;

async function reissueTokens() {
  const refreshToken = getRefreshToken();
  if (!refreshToken) {
    throw new Error("refresh token이 없습니다.");
  }

  // 동시에 여러 요청이 401을 받아도 재발급 요청은 한 번만 나가도록 합니다.
  if (!reissuePromise) {
    reissuePromise = axios
      .put(`${API_BASE_URL}/api/v1/auth/reissue`, null, {
        headers: { "X-Refresh-Token": refreshToken },
      })
      .then((res) => {
        saveTokens(res.data);
        return res.data;
      })
      .finally(() => {
        reissuePromise = null;
      });
  }

  return reissuePromise;
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    const isAuthEndpoint =
      original?.url?.includes("/auth/signin") ||
      original?.url?.includes("/auth/signup") ||
      original?.url?.includes("/auth/reissue");

    if (error.response?.status === 401 && !original?._retry && !isAuthEndpoint) {
      original._retry = true;
      try {
        await reissueTokens();
        return api(original);
      } catch {
        clearTokens();

        try {
          localStorage.removeItem(USER_KEY);
          sessionStorage.removeItem(USER_KEY);
          localStorage.removeItem(USER_NAME_KEY);
          sessionStorage.removeItem(USER_NAME_KEY);
        } catch {
          // ignore
        }

        window.location.reload();
      }
    }

    return Promise.reject(error);
  }
);

function rememberUser(identifier, remember) {
  try {
    const value = JSON.stringify(identifier);
    if (remember) {
      localStorage.setItem(USER_KEY, value);
    } else {
      sessionStorage.setItem(USER_KEY, value);
      localStorage.removeItem(USER_KEY);
    }
  } catch {
  }
}

// 화면 표시용 이름 저장 (USER_KEY와는 별개 - 저건 이메일 저장용)
function saveUserName(name, remember) {
  if (!name) return;
  try {
    const value = JSON.stringify(name);
    if (remember) {
      localStorage.setItem(USER_NAME_KEY, value);
      sessionStorage.removeItem(USER_NAME_KEY);
    } else {
      sessionStorage.setItem(USER_NAME_KEY, value);
      localStorage.removeItem(USER_NAME_KEY);
    }
  } catch {
  }
}

// ---- 로그인 상태에서 쓰는 계정 관련 API -----------------------------------
// 세 API 모두 `api` 인스턴스를 쓰므로 Authorization: Bearer {accessToken}
// 헤더가 자동으로 붙습니다. (백엔드팀 확인 완료: 2024 테스트 스펙 기준)

// PATCH /api/v1/auth/password
// 비로그인 상태의 "비밀번호 찾기"가 아니라, 로그인된 사용자의 "비밀번호 변경" API입니다.
// currentPassword를 알아야 하므로 마이페이지/설정 화면 등 로그인 후 진입하는 곳에서만 써야 합니다.
async function changePassword(currentPassword, newPassword) {
  await api.patch("/api/v1/auth/password", {
    currentPassword,
    newPassword,
  });
}

// DELETE /api/v1/auth/signout
async function logoutUser(onFinally) {
  try {
    await api.delete("/api/v1/auth/signout");
  } catch (err) {
    console.error("로그아웃 요청 실패:", err);
    // 서버 요청이 실패해도 로컬 토큰은 지워서 로그아웃 상태로 만듭니다.
  } finally {
    clearTokens();
    try {
      localStorage.removeItem(USER_KEY);
      sessionStorage.removeItem(USER_KEY);
      localStorage.removeItem(USER_NAME_KEY);
      sessionStorage.removeItem(USER_NAME_KEY);
    } catch {
      // ignore
    }
    if (onFinally) onFinally();
  }
}

// DELETE /api/v1/member/withdraw
// 백엔드가 탈퇴 시 현재 비밀번호 검증을 한다면, 반드시 password를 같이 보내야
// 서버에서 대조가 됩니다. (요청 바디로 전송 - 400/다른 에러가 나면 쿼리 파라미터
// 방식(@RequestParam)으로 바꿔야 할 수도 있으니 백엔드팀 확인 필요)
async function withdrawAccount(password) {
  await api.delete("/api/v1/member/withdraw", { data: { password } });
  clearTokens();
  try {
    localStorage.removeItem(USER_KEY);
    sessionStorage.removeItem(USER_KEY);
    localStorage.removeItem(USER_NAME_KEY);
    sessionStorage.removeItem(USER_NAME_KEY);
  } catch {
    // ignore
  }
}

function LoginPage({ onBackHome, onForgotPassword, onLoginSuccess, onSignup }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const canLogin = email.trim() !== "" && password !== "" && !isSubmitting;

  async function handleSubmit(event) {
    event.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);
    setError("");

    const normalizedEmail = normalizeEmail(email);

    try {
      const response = await api.post("/api/v1/auth/signin", {
        email: normalizedEmail,
        password,
      });

      const {
        accessToken,
        refreshToken,
        accessTokenExpiresIn,
        refreshTokenExpiresIn,
        name,
      } = response.data;

      saveTokens({
        accessToken,
        refreshToken,
        accessTokenExpiresIn,
        refreshTokenExpiresIn,
      });
      rememberUser(normalizedEmail, remember);
      // 로그인 응답에 name이 실제로 오는지 백엔드 확인 필요합니다.
      // 안 오면 name이 undefined라 saveUserName이 그냥 아무것도 안 하고,
      // HomeApp은 예전처럼 이메일로 폴백해서 보여줍니다.
      saveUserName(name, remember);

      onLoginSuccess({ email: normalizedEmail, name }, remember);
    } catch (err) {
      console.error(err);
      if (err.response?.status === 401) {
        setError("아이디 또는 비밀번호가 일치하지 않습니다.");
      } else {
        setError("로그인 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.");
      }
    } finally {
      setIsSubmitting(false);
    }
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

// 참고: 현재 백엔드에는 "로그인 없이 이메일 인증만으로 비밀번호를 재설정"하는
// API가 없습니다. (/api/v1/auth/email 은 되지만 email/verify는 빈 바디만 주고,
// 비밀번호 변경 API는 로그인 + 현재 비밀번호가 반드시 필요합니다.)
// 그래서 예전 코드처럼 "메일을 보냈습니다"라고 안내하면 실제로는 아무 것도
// 일어나지 않는 거짓 성공 메시지가 됩니다. 백엔드에 재설정 기능이 추가되기
// 전까지는 솔직하게 안내만 하도록 임시로 막아둡니다.
function ForgotPasswordPage({ onBackToLogin }) {
  return (
    <div className="auth-page">
      <div className="auth-card forgot-card">
        <h1 className="auth-title">비밀번호 찾기</h1>

        <div className="auth-form">
          <p className="auth-notice">
            죄송합니다. 현재는 로그인 없이 이메일 인증만으로 비밀번호를
            재설정하는 기능을 지원하지 않습니다.
            <br />
            <br />
            비밀번호가 기억나지 않으신다면 관리자에게 문의해 주세요.
          </p>
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
      </div>
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

  const [department, setDepartment] = useState(""); // 백엔드 enum 값: SW / IOT / AI
  const [grade, setGrade] = useState(""); // 백엔드 필드: grade (숫자, 학년)

  const [showDepartment, setShowDepartment] = useState(false);
  const [showGrade, setShowGrade] = useState(false);

  const [code1, setCode1] = useState("");
  const [code2, setCode2] = useState("");
  const [code3, setCode3] = useState("");
  const [code4, setCode4] = useState("");
  const [code5, setCode5] = useState("");
  const [code6, setCode6] = useState("");

  const [time, setTime] = useState(300);

  const [emailError, setEmailError] = useState("");
  const [passwordFormatError, setPasswordFormatError] = useState("");
  const [passwordMatchError, setPasswordMatchError] = useState("");
  const [isSigningUp, setIsSigningUp] = useState(false);

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
      setPasswordFormatError("");
      setPasswordMatchError("");
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

  async function signupNext() {
    const normalizedEmail = normalizeEmail(email);

    if (!normalizedEmail.includes("@")) {
      setEmailError("올바른 이메일 형식이 아닙니다.");
      return;
    }

    try {
      await publicApi.post("/api/v1/auth/email", null, {
        params: { email: normalizedEmail },
      });

      setEmailError("");
      setEmail(normalizedEmail);
      setPage("verify");
    } catch (err) {
      console.error("이메일 발송 실패:", err);
      setEmailError("인증 메일 전송에 실패했습니다.");
    }
  }

  async function finishVerification() {
    const code = code1 + code2 + code3 + code4 + code5 + code6;

    try {
      await publicApi.post("/api/v1/auth/email/verify", null, {
        params: {
          email,
          code,
        },
      });

      setPage("password");
    } catch (err) {
      console.error(err);
      const message = err.response?.status === 400
        ? "인증번호가 올바르지 않습니다."
        : "인증 처리 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.";
      alert(message);
    }
  }

  // 백엔드 비밀번호 정책: 영문 + 숫자 + 특수문자를 모두 포함한 8자 이상
  // (서버가 이 조건을 어기면 400을 주는데, 프론트에서 미리 안 막으면
  // 회원가입 마지막 단계까지 다 가서야 에러를 받게 됨)
  const PASSWORD_RULE = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;

  function passwordNext() {
    const formatOk = PASSWORD_RULE.test(password);
    const matchOk = password !== "" && password === passwordConfirm;

    setPasswordFormatError(
      formatOk ? "" : "비밀번호는 영문, 숫자, 특수문자를 포함하여 8자 이상이어야 합니다."
    );
    setPasswordMatchError(matchOk ? "" : "비밀번호가 일치하지 않습니다.");

    if (!formatOk || !matchOk) return;

    setPage("profile");
  }

  async function finishSignup() {
    if (isSigningUp) return;
    setIsSigningUp(true);

    try {
      await publicApi.post("/api/v1/auth/signup", {
        name: name.trim(),
        email: normalizeEmail(email),
        password,
        department, // 이미 SW/IOT/AI enum 값으로 저장되어 있음 (DEPARTMENT_OPTIONS 참고)
        grade,
      });

      // 서버가 실제로 계정을 만든 뒤에만 완료 화면으로 이동합니다.
      setPage("complete");
    } catch (err) {
      console.error(err);
      const code = err.response?.data?.code;
      if (err.response?.status === 401 && code === "EMAIL_NOT_VERIFIED") {
        alert("이메일 인증이 완료되지 않았습니다. 인증을 다시 진행해 주세요.");
        setPage("verify");
      } else if (err.response?.status === 409) {
        alert("이미 가입된 이메일입니다.");
      } else {
        alert("회원가입 처리 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.");
      }
    } finally {
      setIsSigningUp(false);
    }
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
                    setPasswordFormatError("");
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

              {passwordFormatError !== "" && (
                <p className="error-text">{passwordFormatError}</p>
              )}
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
                    setPasswordMatchError("");
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

              {passwordMatchError !== "" && (
                <p className="error-text">{passwordMatchError}</p>
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
                  <span>
                    {DEPARTMENT_OPTIONS.find((opt) => opt.value === department)
                      ?.label || "학과를 선택해주세요."}
                  </span>

                  {showDepartment ? (
                    <FiChevronUp size={22} />
                  ) : (
                    <FiChevronDown size={22} />
                  )}
                </button>

                {showDepartment && (
                  <div className="dropdown">
                    {DEPARTMENT_OPTIONS.map((opt) => (
                      <div
                        key={opt.value}
                        className={`dropdown-item ${
                          department === opt.value ? "active" : ""
                        }`}
                        onClick={() => {
                          setDepartment(opt.value);
                          setShowDepartment(false);
                        }}
                      >
                        {opt.label}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/*
              원래 있던 "기수" 필드는 백엔드에 대응하는 컬럼이 없습니다.
              백엔드는 대신 grade(학년, 숫자)를 가지고 있어서 학년 선택으로 대체했습니다.
              "기수" 정보가 서비스에 꼭 필요하다면 기획팀과 먼저 상의해서
              백엔드에 필드 추가를 요청해야 합니다.
            */}
            <div className="input-group">
              <label>학년</label>

              <div className="select-wrapper">
                <button
                  type="button"
                  className={`select-box ${grade !== "" ? "selected" : ""}`}
                  onClick={() => setShowGrade(!showGrade)}
                >
                  <span>
                    {GRADE_OPTIONS.find((opt) => opt.value === grade)?.label ||
                      "학년을 선택해주세요."}
                  </span>

                  {showGrade ? (
                    <FiChevronUp size={22} />
                  ) : (
                    <FiChevronDown size={22} />
                  )}
                </button>

                {showGrade && (
                  <div className="dropdown">
                    {GRADE_OPTIONS.map((opt) => (
                      <div
                        key={opt.value}
                        className={`dropdown-item ${
                          grade === opt.value ? "active" : ""
                        }`}
                        onClick={() => {
                          setGrade(opt.value);
                          setShowGrade(false);
                        }}
                      >
                        {opt.label}
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
                department !== "" && grade !== "" && !isSigningUp
                  ? "next-btn active"
                  : "next-btn"
              }
              disabled={department === "" || grade === "" || isSigningUp}
              onClick={finishSignup}
            >
              {isSigningUp ? "처리 중..." : "회원가입"}
            </button>
          </div>
        </div>
      )}

      {page === "complete" && (
        <div className="overlay">
          <div className="complete-modal">
            <button
              className="close-icon"
              onClick={onComplete}
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

            <button className="next-btn active" onClick={onComplete}>
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

  function goToLogin() {
    setAuthView("login");
    setHomeKey((key) => key + 1);
  }

  // 로그아웃: 서버 요청 성공/실패와 무관하게 로컬 토큰을 지우고 로그인 화면으로 보냅니다.
  function handleLogout() {
    return logoutUser(goToLogin);
  }

  // HomeApp(src home)의 탈퇴 모달이 이미 비밀번호 + "탈퇴" 문구 입력으로
  // 확인을 받으므로, 여기서 또 window.confirm을 띄우지 않습니다.
  // (예전엔 여기서 confirm을 한 번 더 띄웠는데, 취소를 눌러도 에러 없이
  // 함수가 끝나버려서 HomeApp이 성공으로 착각하고 "탈퇴 완료" 메시지를
  // 띄우는 버그가 있었습니다.)
  // 에러도 여기서 alert로 삼키지 않고 그대로 던져서, HomeApp의
  // handleWithdrawConfirm이 실제 실패 메시지를 보여줄 수 있게 합니다.
  async function handleWithdraw(password) {
    await withdrawAccount(password);
    goToLogin();
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

  return (
    <HomeApp
      key={homeKey}
      onAuthNavigate={setAuthView}
      onLogout={handleLogout}
      onChangePassword={changePassword}
      onWithdraw={handleWithdraw}
    />
  );
}
