import { api } from "./apiClient";

const POST_ENDPOINT = "/api/v1/post";

/** 글 작성. 성공 시 201 + Location 헤더, body는 비어있음.
 *  반환값: 새로 생성된 postId (Location 헤더에서 추출, 실패 시 null) */
export async function createPost({ title, contentType, foundPlace, photoUrl, content }) {
  const body = { title, contentType };
  if (foundPlace) body.foundPlace = foundPlace;
  if (photoUrl) body.photoUrl = photoUrl;
  if (content) body.content = content;

  const res = await api.post(POST_ENDPOINT, body);

  const location = res.headers?.location || res.headers?.Location;
  if (location) {
    const match = String(location).match(/(\d+)\/?$/);
    if (match) return Number(match[1]);
  }
  return null;
}

/** 목록 조회 (페이징). 응답은 Spring Page 형태:
 *  { content: [...], totalPages, totalElements, number, size } */
export async function listPosts({ page = 0, size = 10 } = {}) {
  const res = await api.get(POST_ENDPOINT, { params: { page, size } });
  return res.data;
}

/** 상세 조회 */
export async function getPost(postId) {
  const res = await api.get(`${POST_ENDPOINT}/${postId}`);
  return res.data;
}

/** 내 글 목록 */
export async function getMyPosts() {
  const res = await api.get(`${POST_ENDPOINT}/mypost`);
  return res.data;
}

/** 삭제 */
export async function deletePostApi(postId) {
  await api.delete(`${POST_ENDPOINT}/${postId}`);
}
function pick(obj, keys, fallback = undefined) {
  for (const key of keys) {
    if (obj?.[key] !== undefined && obj[key] !== null) return obj[key];
  }
  return fallback;
}

function formatDate(value) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleDateString("ko-KR");
}

export function mapApiPost(apiPost) {
  if (!apiPost) return null;

  const contentType = apiPost.contentType;
  const isReport = contentType === "REPORT"; // REPORT = 신고, FOUND = 제보

  const id = pick(apiPost, ["postId", "id"]);
  const author = pick(
    apiPost,
    ["authorName", "writer", "author", "nickname", "memberName", "userName","email"],
    "작성자"
  );
  const createdAt = pick(apiPost, ["createdAt", "createdDate", "regDate", "createdTime"]);

  return {
    id,
    title: apiPost.title || "",
    author,
    date: formatDate(createdAt),
    status: isReport ? "찾는중" : "보관중",
    image: apiPost.photoUrl || null,
    place: apiPost.foundPlace || "",
    note: isReport ? apiPost.content || "" : undefined,
    feature: !isReport ? apiPost.content || "" : undefined,
    content: apiPost.content || "",
    contentType,
    comments: [],
  };
}

export function mapApiPostList(pageResponse) {
  const items = Array.isArray(pageResponse?.content) ? pageResponse.content : [];
  return items.map(mapApiPost).filter(Boolean);
}