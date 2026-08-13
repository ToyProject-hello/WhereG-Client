import axios from "axios";
export const ACCESS_TOKEN_KEY = "wg_access_token";
export const REFRESH_TOKEN_KEY = "wg_refresh_token";
export const ACCESS_EXPIRES_KEY = "wg_access_expires_at";
export const REFRESH_EXPIRES_KEY = "wg_refresh_expires_at";

export const API_BASE_URL = import.meta.env.VITE_API_URL || "https://whereg.site";

// ---- 토큰 저장/조회 --------------------------------------------------------
export function saveTokens({
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

export function getAccessToken() {
  try {
    return localStorage.getItem(ACCESS_TOKEN_KEY);
  } catch {
    return null;
  }
}

export function getRefreshToken() {
  try {
    return localStorage.getItem(REFRESH_TOKEN_KEY);
  } catch {
    return null;
  }
}

export function clearTokens() {
  try {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(ACCESS_EXPIRES_KEY);
    localStorage.removeItem(REFRESH_EXPIRES_KEY);
  } catch {
    // ignore
  }
}

export function hasAccessToken() {
  return Boolean(getAccessToken());
}
export const api = axios.create({ baseURL: API_BASE_URL });

export const publicApi = axios.create({ baseURL: API_BASE_URL });

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
          localStorage.removeItem("wg_user");
          sessionStorage.removeItem("wg_user");
          localStorage.removeItem("wg_user_name");
          sessionStorage.removeItem("wg_user_name");
        } catch {
          // ignore
        }

        window.location.reload();
      }
    }

    return Promise.reject(error);
  }
);