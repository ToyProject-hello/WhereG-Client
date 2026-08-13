import { useState, useRef, useEffect } from 'react';
import './App.css';
import Header from './components/Header';
import FabMenu from './components/FabMenu';
import NotificationDropdown from './components/NotificationDropdown';
import ProfileMenu from './components/ProfileMenu';
import Home from './pages/Home';
import LostReport from './pages/LostReport';
import LostClaim from './pages/LostClaim';
import Notice from './pages/Notice';
import NoticeWrite from './pages/NoticeWrite';
import NoticeDetail from './pages/NoticeDetail';
import LostReportForm from './pages/LostReportForm';
import LostClaimForm from './pages/LostClaimForm';
import DetailPage from './pages/DetailPage';
import { listPosts, createPost, deletePostApi, mapApiPostList } from '../src/lib/postsApi';
import { hasAccessToken } from '../src/lib/apiClient';

const sanitizeNotifications = (items) => (
  Array.isArray(items)
    ? items.filter((item) => item && !String(item.id || '').startsWith('demo-note'))
    : []
);

const getNotificationSnapshot = (post) => {
  if (!post) return null;
  const snapshot = {
    id: post.id,
    title: post.title,
    author: post.author,
    date: post.date,
    status: post.status,
    place: post.place,
    note: post.note,
    feature: post.feature,
    description: post.description,
    comments: post.comments || [],
  };

  if (post.image && String(post.image).length < 50000) {
    snapshot.image = post.image;
  }

  return snapshot;
};

export default function App({
  onAuthNavigate,
  onLogout,
  onChangePassword,
  onWithdraw,
} = {}) {
  const [page, setPage] = useState('home');
  // 게시글(신고/제보)은 이제 localStorage가 아니라 서버 API(/api/v1/post)에서
  // 가져옵니다. 아래 두 state는 "서버에서 받아온 목록의 화면용 캐시"입니다.
  const [reports, setReports] = useState([]);
  const [claims, setClaims] = useState([]);
  const [postsLoading, setPostsLoading] = useState(true);
  const [notices, setNotices] = useState(() => {
    try {
      const raw = localStorage.getItem('wg_notices');
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });
  const [isFabOpen, setIsFabOpen] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);
  // 로고/'홈' 클릭 시 Home을 강제로 새로 마운트시키기 위한 카운터.
  // (이미 홈 화면일 때 로고를 눌러도 page state가 'home' -> 'home'으로
  // 바뀌지 않아서 리렌더가 안 일어나고, Home 내부의 검색어 같은 상태가
  // 그대로 남아있던 문제. key를 매번 바꿔서 완전히 새로 그리게 만듭니다.)
  const [homeResetKey, setHomeResetKey] = useState(0);
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      // wg_user_name: src/App.jsx가 로그인 시 저장하는 "이름" 전용 키.
      // wg_user는 원래 "로그인 상태 유지"용으로 이메일이 들어가는 키라,
      // 예전엔 이걸 그대로 이름처럼 써서 헤더/작성자 표시에 이메일이 나왔습니다.
      // (백엔드 로그인 응답에 아직 name이 안 오면 wg_user_name이 비어있어서
      // 결국 이메일로 폴백되니, 화면에 계속 이메일이 뜨면 로그인 API 응답에
      // name 필드가 실제로 오는지 백엔드에 확인해야 합니다.)
      const nameRaw =
        localStorage.getItem('wg_user_name') || sessionStorage.getItem('wg_user_name');
      if (nameRaw) return JSON.parse(nameRaw);

      const raw = localStorage.getItem('wg_user') || sessionStorage.getItem('wg_user');
      if (raw === 'WG_LOGGED_OUT') return null;
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState(() => {
    try {
      const raw = localStorage.getItem('wg_notifications');
      return raw ? sanitizeNotifications(JSON.parse(raw)) : [];
    } catch {
      return [];
    }
  });
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [loginName, setLoginName] = useState('');
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [passwordForm, setPasswordForm] = useState({ current: '', next: '', confirm: '' });
  const [withdrawForm, setWithdrawForm] = useState({ password: '', phrase: '' });
  const [statusMessage, setStatusMessage] = useState(null);
  const [focusTarget, setFocusTarget] = useState(null);
  const [accountActionPending, setAccountActionPending] = useState(false);
  const statusTimerRef = useRef(null);

  useEffect(() => {
    return () => {
      if (statusTimerRef.current) {
        clearTimeout(statusTimerRef.current);
      }
    };
  }, []);
  const isAdmin = currentUser === '양지우' || currentUser === '정성원';
  const unreadCount = currentUser ? notifications.filter((n) => n.recipient === currentUser && !n.read).length : 0;
  const showStatus = (message, type = 'error') => {
    setStatusMessage({ message, type });
    if (statusTimerRef.current) {
      clearTimeout(statusTimerRef.current);
    }
    statusTimerRef.current = setTimeout(() => setStatusMessage(null), 3000);
  };

  const showError = (message) => showStatus(message, 'error');
  const showSuccess = (message) => showStatus(message, 'success');
  const getAccountErrorMessage = (error, fallback) => (
    error?.response?.data?.message
    || error?.response?.data?.error
    || fallback
  );

  // ---- 게시글(신고/제보) 서버 연동 -----------------------------------------
  // GET /api/v1/post 도 다른 API와 마찬가지로 JWT가 필요합니다.
  // (로그인 안 한 상태에서 호출하면 401이 나므로, 애초에 토큰이 없으면
  // 요청을 보내지 않고 빈 목록으로 둡니다. -> 로그인 후 다시 로드됩니다.)
  //
  // 백엔드에 contentType(REPORT/FOUND) 필터가 따로 없어서, 일단 넉넉한
  // size로 한 번에 받아온 뒤 화면에서 LOST/FOUND로 나눕니다. 게시글이
  // 많아지면 백엔드에 필터/더 큰 페이지네이션을 요청하는 게 좋습니다.
  const loadPosts = async () => {
    if (!hasAccessToken()) {
      setReports([]);
      setClaims([]);
      setPostsLoading(false);
      return;
    }
    setPostsLoading(true);
    try {
      const pageData = await listPosts({ page: 0, size: 100 });
      const posts = mapApiPostList(pageData);
      setReports(posts.filter((p) => p.contentType === 'REPORT'));
      setClaims(posts.filter((p) => p.contentType === 'FOUND'));
    } catch (error) {
      console.error('게시글 목록 조회 실패:', error);
      showError(getAccountErrorMessage(error, '게시글을 불러오지 못했습니다'));
    } finally {
      setPostsLoading(false);
    }
  };

  // 최초 마운트 시, 그리고 로그인/로그아웃으로 currentUser가 바뀔 때마다
  // 서버에서 게시글을 다시 불러옵니다.
  useEffect(() => {
    loadPosts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser]);

  const completeLocalLogout = () => {
    setCurrentUser(null);
    localStorage.setItem('wg_user', 'WG_LOGGED_OUT');
    sessionStorage.removeItem('wg_user');
    localStorage.removeItem('wg_user_name');
    sessionStorage.removeItem('wg_user_name');
    setPage('home');
  };

  const goToPage = (nextPage, payload = null, options = {}) => {
    if (!currentUser && ['noticeWrite', 'reportForm', 'claimForm'].includes(nextPage)) {
      showError('로그인 후 이용해주세요');
      return;
    }
    if (nextPage === 'home') {
      setHomeResetKey((key) => key + 1);
    }
    setFocusTarget(options.focusTarget || null);
    setPage(nextPage);
    setShowNotifications(false);
    setShowProfileMenu(false);
    setIsFabOpen(false);
    setSelectedPost(payload);
  };

  // LostReportForm/LostClaimForm이 넘겨주는 post 객체(title/author/date/
  // status/image/place/note|feature)를 백엔드 게시글 작성 API 바디로 변환해서
  // 보냅니다. 성공하면 서버 목록을 다시 불러와 화면을 최신 상태로 맞춥니다.
  // (사진은 아직 서버로 안 보냅니다 - 위 postsApi.js 상단 주석 참고)
  const addReport = async (post) => {
    if (!currentUser) {
      showError('로그인 후 이용해주세요');
      return false;
    }
    try {
      await createPost({
        title: post.title,
        contentType: 'REPORT',
        foundPlace: post.place,
        content: post.note,
      });
      await loadPosts();
      showSuccess('게시글이 등록되었습니다');
      return true;
    } catch (error) {
      console.error('분실물 신고 등록 실패:', error);
      showError(getAccountErrorMessage(error, '게시글 등록 중 오류가 발생했습니다'));
      return false;
    }
  };

  const addClaim = async (post) => {
    if (!currentUser) {
      showError('로그인 후 이용해주세요');
      return false;
    }
    try {
      await createPost({
        title: post.title,
        contentType: 'FOUND',
        foundPlace: post.place,
        content: post.feature,
      });
      await loadPosts();
      showSuccess('게시글이 등록되었습니다');
      return true;
    } catch (error) {
      console.error('분실물 제보 등록 실패:', error);
      showError(getAccountErrorMessage(error, '게시글 등록 중 오류가 발생했습니다'));
      return false;
    }
  };

  const addNotice = (notice) => {
    const next = [{ ...notice, id: notice.id || `n-${Date.now()}` }, ...notices];
    setNotices(next);
    localStorage.setItem('wg_notices', JSON.stringify(next));
  };

  const addNoticeComment = (noticeId, comment) => {
    let updatedNotice = null;
    const noticeCommentCount = notices.find((notice) => notice.id === noticeId)?.comments?.length || 0;
    const newComment = { ...comment, id: comment.id || `ncm-${noticeId}-${noticeCommentCount + 1}` };
    const next = notices.map((notice) => {
      if (notice.id === noticeId) {
        const comments = notice.comments ? [...notice.comments, newComment] : [newComment];
        updatedNotice = { ...notice, comments };
        return updatedNotice;
      }
      return notice;
    });
    setNotices(next);
    localStorage.setItem('wg_notices', JSON.stringify(next));
    const updated = next.find((notice) => notice.id === noticeId);
    if (updated) setSelectedPost(updated);
    if (updatedNotice?.author && comment.author && updatedNotice.author !== comment.author) {
      addNotification(updatedNotice.author, '공지에 새 댓글이 있어요.', comment.text || updatedNotice.title || '내용', {
        page: 'noticeDetail',
        postId: updatedNotice.id,
        commentId: newComment.id,
        postSnapshot: getNotificationSnapshot(updatedNotice),
      });
    }
  };

  const addNotification = (recipient, title, subtitle, target = null) => {
    if (!recipient) return;
    const note = { id: `nt-${Date.now()}-${Math.random().toString(36).slice(2)}`, recipient, title, subtitle, target, time: new Date().toISOString(), read: false };
    setNotifications((current) => {
      const next = [note, ...sanitizeNotifications(current)];
      try { localStorage.setItem('wg_notifications', JSON.stringify(next)); } catch {
        // Ignore storage failures so comments still update in memory.
      }
      return next;
    });
  };

  const updateSelectedPostComments = (postId, buildComments) => {
    if (!selectedPost || selectedPost.id !== postId) return null;
    const comments = buildComments(selectedPost.comments || []);
    const updated = { ...selectedPost, comments };
    setSelectedPost(updated);
    return updated;
  };

  const markNotificationsReadForUser = (user) => {
    if (!user) return;
    const next = sanitizeNotifications(notifications).map((n) => (
      n.recipient === user ? { ...n, read: true } : n
    ));
    setNotifications(next);
    try { localStorage.setItem('wg_notifications', JSON.stringify(next)); } catch {
      // Ignore storage failures so the notification menu can still update.
    }
  };

  const markNotificationRead = (notificationId) => {
    if (!notificationId) return;
    const next = sanitizeNotifications(notifications).map((n) => (
      n.id === notificationId ? { ...n, read: true } : n
    ));
    setNotifications(next);
    try { localStorage.setItem('wg_notifications', JSON.stringify(next)); } catch {
      // Ignore storage failures so navigation can continue.
    }
  };

  const getNotificationPage = (target) => {
    if (!target) return null;
    if (target.page) return target.page;
    if (target.postType === 'claim') return 'claimDetail';
    if (target.postType === 'report') return 'reportDetail';
    return null;
  };

  const getNotificationPost = (target, targetPage) => {
    const postId = target?.postId || target?.noticeId;
    if (!postId) return null;
    const source = targetPage === 'noticeDetail'
      ? notices
      : targetPage === 'claimDetail'
        ? claims
        : reports;
    return (
      source.find((item) => item.id === postId)
      || (selectedPost?.id === postId ? selectedPost : null)
      || target?.postSnapshot
      || null
    );
  };

  const handleNotificationOpen = (notification) => {
    markNotificationRead(notification?.id);
    const target = notification?.target;
    const targetPage = getNotificationPage(target);
    const postId = target?.postId || target?.noticeId;
    if (!targetPage || !postId) {
      setShowNotifications(false);
      showError('이동할 알림 위치를 찾을 수 없습니다');
      return;
    }

    const targetPost = getNotificationPost(target, targetPage);

    if (!targetPost) {
      setShowNotifications(false);
      showError('해당 글이 삭제되었거나 찾을 수 없습니다');
      return;
    }

    goToPage(targetPage, targetPost, {
      focusTarget: {
        postId,
        commentId: target.commentId || null,
        replyId: target.replyId || null,
      },
    });
  };

  const updatePost = (postType, postId, updates) => {
    const target = postType === 'report' ? reports : claims;
    const setter = postType === 'report' ? setReports : setClaims;
    const key = postType === 'report' ? 'wg_reports' : 'wg_claims';
    const existing = target.find((p) => p.id === postId) || (selectedPost?.id === postId ? selectedPost : null);
    if (!existing) {
      showError('해당 글을 찾을 수 없습니다');
      return null;
    }
    if (!currentUser || (existing.author !== currentUser && !isAdmin)) {
      showError('권한이 없습니다');
      return null;
    }
    const updated = { ...existing, ...updates };
    const hasStoredPost = target.some((p) => p.id === postId);
    if (hasStoredPost) {
      const next = target.map((p) => (p.id === postId ? updated : p));
      setter(next);
      localStorage.setItem(key, JSON.stringify(next));
    }
    setSelectedPost(updated);
    return updated;
  };

  // 삭제는 이제 DELETE /api/v1/post/{postId} 를 호출합니다.
  // (DetailPage는 이 함수를 await 없이 호출하지만, 함수 자체는 비동기로
  // 동작하고 성공/실패에 따라 알맞은 안내를 보여줍니다.)
  const deletePost = async (postType, postId) => {
    const target = postType === 'report' ? reports : claims;
    const setter = postType === 'report' ? setReports : setClaims;
    const existing = target.find((p) => p.id === postId) || (selectedPost?.id === postId ? selectedPost : null);
    if (!existing) {
      showError('해당 글을 찾을 수 없습니다');
      return false;
    }
    if (!currentUser || (existing.author !== currentUser && !isAdmin)) {
      showError('권한이 없습니다');
      return false;
    }
    try {
      await deletePostApi(postId);
    } catch (error) {
      console.error('게시글 삭제 실패:', error);
      showError(getAccountErrorMessage(error, '게시글 삭제 중 오류가 발생했습니다'));
      return false;
    }
    const next = target.filter((p) => p.id !== postId);
    setter(next);
    setSelectedPost(null);
    showSuccess('게시물이 삭제되었습니다');
    goToPage(postType === 'report' ? 'report' : 'claim');
    return true;
  };

  const updateNotice = (noticeId, updates) => {
    const existing = notices.find((notice) => notice.id === noticeId);
    if (!existing) {
      showError('해당 공지를 찾을 수 없습니다');
      return null;
    }
    if (!currentUser || (existing.author !== currentUser && !isAdmin)) {
      showError('권한이 없습니다');
      return null;
    }
    const updated = { ...existing, ...updates, id: noticeId, author: existing.author || currentUser };
    const next = notices.map((notice) => (notice.id === noticeId ? updated : notice));
    setNotices(next);
    localStorage.setItem('wg_notices', JSON.stringify(next));
    setSelectedPost(updated);
    return updated;
  };

  const deleteNotice = (noticeId) => {
    const existing = notices.find((notice) => notice.id === noticeId);
    if (!existing) {
      showError('해당 공지를 찾을 수 없습니다');
      return false;
    }
    if (!currentUser || (existing.author !== currentUser && !isAdmin)) {
      showError('권한이 없습니다');
      return false;
    }
    const next = notices.filter((notice) => notice.id !== noticeId);
    setNotices(next);
    localStorage.setItem('wg_notices', JSON.stringify(next));
    setSelectedPost(null);
    showSuccess('공지가 삭제되었습니다');
    goToPage('notice');
    return true;
  };

  const addComment = (postType, postId, comment) => {
    const target = postType === 'report' ? reports : claims;
    const setter = postType === 'report' ? setReports : setClaims;
    const key = postType === 'report' ? 'wg_reports' : 'wg_claims';
    const newComment = { ...comment, id: `cm-${Date.now()}`, replies: [] };
    let updated = null;
    const next = target.map((p) => {
      if (p.id === postId) {
        const comments = p.comments ? [...p.comments, newComment] : [newComment];
        updated = { ...p, comments };
        return updated;
      }
      return p;
    });
    setter(next);
    localStorage.setItem(key, JSON.stringify(next));
    if (!updated) {
      updated = updateSelectedPostComments(postId, (comments) => [...comments, newComment]);
    } else {
      setSelectedPost(updated);
    }
    if (updated && updated.author && comment.author && updated.author !== comment.author) {
      addNotification(updated.author, `${postType === 'claim' ? '제보한' : '신고한'} 글에 새 댓글이 있어요.`, comment.text || updated.title || '내용', {
        page: postType === 'claim' ? 'claimDetail' : 'reportDetail',
        postType,
        postId,
        commentId: newComment.id,
        postSnapshot: getNotificationSnapshot(updated),
      });
    }
  };

  const findReplyInTree = (replies = [], replyId) => {
    for (const reply of replies) {
      if (reply.id === replyId) return reply;
      const nested = findReplyInTree(reply.replies || [], replyId);
      if (nested) return nested;
    }
    return null;
  };

  const addReplyToTree = (replies = [], parentReplyId, newReply) => (
    replies.map((reply) => {
      if (reply.id === parentReplyId) {
        return { ...reply, replies: [...(reply.replies || []), newReply] };
      }
      return { ...reply, replies: addReplyToTree(reply.replies || [], parentReplyId, newReply) };
    })
  );

  const removeReplyFromTree = (replies = [], replyId) => (
    replies
      .filter((reply) => reply.id !== replyId)
      .map((reply) => ({ ...reply, replies: removeReplyFromTree(reply.replies || [], replyId) }))
  );

  const updateReplyInTree = (replies = [], replyId, updates) => (
    replies.map((reply) => (
      reply.id === replyId
        ? { ...reply, ...updates }
        : { ...reply, replies: updateReplyInTree(reply.replies || [], replyId, updates) }
    ))
  );

  const addReply = (postType, postId, commentId, reply, parentReplyId = null) => {
    const target = postType === 'report' ? reports : claims;
    const setter = postType === 'report' ? setReports : setClaims;
    const key = postType === 'report' ? 'wg_reports' : 'wg_claims';
    let updated = null;
    let notifiedAuthor = null;
    const replyId = `rpl-${Date.now()}`;
    const newReply = { ...reply, id: replyId, replies: [] };
    const next = target.map((p) => {
      if (p.id === postId) {
        const comments = (p.comments || []).map((c) => {
          if (c.id === commentId) {
            if (!parentReplyId) {
              const replies = [...(c.replies || []), newReply];
              notifiedAuthor = c.author;
              return { ...c, replies };
            }
            const parentReply = findReplyInTree(c.replies || [], parentReplyId);
            notifiedAuthor = parentReply?.author || c.author;
            const replies = addReplyToTree(c.replies || [], parentReplyId, newReply);
            return { ...c, replies };
          }
          return c;
        });
        updated = { ...p, comments };
        return updated;
      }
      return p;
    });
    setter(next);
    localStorage.setItem(key, JSON.stringify(next));
    if (!updated) {
      updated = updateSelectedPostComments(postId, (comments) => comments.map((c) => {
        if (c.id !== commentId) return c;
        if (!parentReplyId) {
          notifiedAuthor = c.author;
          return { ...c, replies: [...(c.replies || []), newReply] };
        }
        const parentReply = findReplyInTree(c.replies || [], parentReplyId);
        notifiedAuthor = parentReply?.author || c.author;
        return { ...c, replies: addReplyToTree(c.replies || [], parentReplyId, newReply) };
      }));
    } else {
      setSelectedPost(updated);
    }
    if (updated) {
      const commentObj = (updated.comments || []).find((c) => c.id === commentId);
      const replyRecipient = notifiedAuthor || commentObj?.author;
      const target = {
        page: postType === 'claim' ? 'claimDetail' : 'reportDetail',
        postType,
        postId,
        commentId,
        replyId,
        postSnapshot: getNotificationSnapshot(updated),
      };
      if (replyRecipient && reply.author && replyRecipient !== reply.author) {
        addNotification(replyRecipient, '내 댓글에 답글이 달렸어요.', reply.text || updated.title || '내용', target);
      }
      if (updated.author && reply.author && updated.author !== reply.author && updated.author !== replyRecipient) {
        addNotification(updated.author, `${postType === 'claim' ? '제보한' : '신고한'} 글에 새 답글이 있어요.`, reply.text || updated.title || '내용', target);
      }
    }
  };

  const deleteComment = (postType, postId, commentId) => {
    const target = postType === 'report' ? reports : claims;
    const setter = postType === 'report' ? setReports : setClaims;
    const key = postType === 'report' ? 'wg_reports' : 'wg_claims';
    const post = target.find((p) => p.id === postId) || (selectedPost?.id === postId ? selectedPost : null);
    if (!post) return;
    const comment = (post.comments || []).find((c) => c.id === commentId);
    if (!comment) return;
    if (!currentUser || comment.author !== currentUser) {
      showError('권한이 없습니다');
      return;
    }
    const buildUpdatedPost = (sourcePost) => ({
      ...sourcePost,
      comments: (sourcePost.comments || []).filter((c) => c.id !== commentId),
    });
    let updated = null;
    if (target.some((p) => p.id === postId)) {
      const next = target.map((p) => {
        if (p.id === postId) {
          updated = buildUpdatedPost(p);
          return updated;
        }
        return p;
      });
      setter(next);
      localStorage.setItem(key, JSON.stringify(next));
    } else {
      updated = buildUpdatedPost(post);
    }
    setSelectedPost(updated);
  };

  const deleteReply = (postType, postId, commentId, replyId) => {
    const target = postType === 'report' ? reports : claims;
    const setter = postType === 'report' ? setReports : setClaims;
    const key = postType === 'report' ? 'wg_reports' : 'wg_claims';
    const post = target.find((p) => p.id === postId) || (selectedPost?.id === postId ? selectedPost : null);
    if (!post) return;
    const comment = (post.comments || []).find((c) => c.id === commentId);
    if (!comment) return;
    const reply = findReplyInTree(comment.replies || [], replyId);
    if (!reply) return;
    if (!currentUser || reply.author !== currentUser) {
      showError('권한이 없습니다');
      return;
    }
    const buildUpdatedPost = (sourcePost) => ({
      ...sourcePost,
      comments: (sourcePost.comments || []).map((c) => (
        c.id === commentId ? { ...c, replies: removeReplyFromTree(c.replies || [], replyId) } : c
      )),
    });
    let updated = null;
    if (target.some((p) => p.id === postId)) {
      const next = target.map((p) => {
        if (p.id === postId) {
          updated = buildUpdatedPost(p);
          return updated;
        }
        return p;
      });
      setter(next);
      localStorage.setItem(key, JSON.stringify(next));
    } else {
      updated = buildUpdatedPost(post);
    }
    setSelectedPost(updated);
  };

  const updateComment = (postType, postId, commentId, text) => {
    const target = postType === 'report' ? reports : claims;
    const setter = postType === 'report' ? setReports : setClaims;
    const key = postType === 'report' ? 'wg_reports' : 'wg_claims';
    const post = target.find((p) => p.id === postId) || (selectedPost?.id === postId ? selectedPost : null);
    if (!post) return;
    const comment = (post.comments || []).find((c) => c.id === commentId);
    if (!comment) return;
    if (!currentUser || comment.author !== currentUser) {
      showError('권한이 없습니다');
      return;
    }
    const buildUpdatedPost = (sourcePost) => ({
      ...sourcePost,
      comments: (sourcePost.comments || []).map((c) => (c.id === commentId ? { ...c, text } : c)),
    });
    let updated = null;
    if (target.some((p) => p.id === postId)) {
      const next = target.map((p) => {
        if (p.id === postId) {
          updated = buildUpdatedPost(p);
          return updated;
        }
        return p;
      });
      setter(next);
      localStorage.setItem(key, JSON.stringify(next));
    } else {
      updated = buildUpdatedPost(post);
    }
    setSelectedPost(updated);
  };

  const updateReply = (postType, postId, commentId, replyId, text) => {
    const target = postType === 'report' ? reports : claims;
    const setter = postType === 'report' ? setReports : setClaims;
    const key = postType === 'report' ? 'wg_reports' : 'wg_claims';
    const post = target.find((p) => p.id === postId) || (selectedPost?.id === postId ? selectedPost : null);
    if (!post) return;
    const comment = (post.comments || []).find((c) => c.id === commentId);
    if (!comment) return;
    const reply = findReplyInTree(comment.replies || [], replyId);
    if (!reply) return;
    if (!currentUser || reply.author !== currentUser) {
      showError('권한이 없습니다');
      return;
    }
    const buildUpdatedPost = (sourcePost) => ({
      ...sourcePost,
      comments: (sourcePost.comments || []).map((c) => (
        c.id === commentId ? { ...c, replies: updateReplyInTree(c.replies || [], replyId, { text }) } : c
      )),
    });
    let updated = null;
    if (target.some((p) => p.id === postId)) {
      const next = target.map((p) => {
        if (p.id === postId) {
          updated = buildUpdatedPost(p);
          return updated;
        }
        return p;
      });
      setter(next);
      localStorage.setItem(key, JSON.stringify(next));
    } else {
      updated = buildUpdatedPost(post);
    }
    setSelectedPost(updated);
  };

  const getActivePage = () => {
    if (page === 'noticeWrite' || page === 'notice' || page === 'noticeDetail') return 'notice';
    if (page === 'report' || page === 'reportForm' || page === 'reportDetail') return 'report';
    if (page === 'claim' || page === 'claimForm' || page === 'claimDetail') return 'claim';
    return 'home';
  };

  const handleProfileSelect = async (action) => {
    if (action === 'password') {
      setPasswordForm({ current: '', next: '', confirm: '' });
      setShowPasswordModal(true);
    }
    setShowProfileMenu(false);
    if (action === 'logout') {
      if (accountActionPending) return;
      setAccountActionPending(true);
      try {
        if (onLogout) {
          await onLogout();
        } else {
          completeLocalLogout();
        }
        showSuccess('로그아웃되었습니다');
      } catch (error) {
        console.error('로그아웃 실패:', error);
        showError(getAccountErrorMessage(error, '로그아웃 처리 중 오류가 발생했습니다'));
      } finally {
        setAccountActionPending(false);
      }
    }
    if (action === 'withdraw') {
      setWithdrawForm({ password: '', phrase: '' });
      setShowWithdrawModal(true);
    }
  };

  const closePasswordModal = () => {
    setShowPasswordModal(false);
    setPasswordForm({ current: '', next: '', confirm: '' });
  };

  const handlePasswordChange = async () => {
    if (accountActionPending) return;
    if (!passwordForm.current || !passwordForm.next || !passwordForm.confirm) {
      showError('모든 항목을 입력해주세요');
      return;
    }
    if (passwordForm.next !== passwordForm.confirm) {
      showError('새 비밀번호가 일치하지 않습니다');
      return;
    }
    setAccountActionPending(true);
    try {
      if (onChangePassword) {
        await onChangePassword(passwordForm.current, passwordForm.next);
      }
      closePasswordModal();
      showSuccess('비밀번호가 변경되었습니다');
    } catch (error) {
      console.error('비밀번호 변경 실패:', error);
      showError(getAccountErrorMessage(error, '비밀번호 변경 중 오류가 발생했습니다'));
    } finally {
      setAccountActionPending(false);
    }
  };

  const handleWithdrawConfirm = async () => {
    if (accountActionPending) return;
    if (!withdrawForm.password || withdrawForm.phrase.trim() !== '탈퇴') {
      showError('비밀번호와 확인 문구를 입력해주세요');
      return;
    }
    setAccountActionPending(true);
    try {
      if (onWithdraw) {
        await onWithdraw(withdrawForm.password);
      } else {
        completeLocalLogout();
      }
      setShowWithdrawModal(false);
      setShowPasswordModal(false);
      setWithdrawForm({ password: '', phrase: '' });
      setShowNotifications(false);
      showSuccess('회원탈퇴가 완료되었습니다');
    } catch (error) {
      console.error('회원탈퇴 실패:', error);
      showError(getAccountErrorMessage(error, '회원탈퇴 처리 중 오류가 발생했습니다'));
    } finally {
      setAccountActionPending(false);
    }
  };

  const handleLogin = (name) => {
    const trimmed = name.trim();
    if (!trimmed) {
      showError('로그인 이름을 입력해주세요.');
      return;
    }
    setCurrentUser(trimmed);
    localStorage.setItem('wg_user', JSON.stringify(trimmed));
    setShowLoginModal(false);
    setLoginName('');
  };

  return (
    <div className="container">
      <Header
        activePage={getActivePage()}
        currentUser={currentUser}
        unreadCount={unreadCount}
        onNavigate={goToPage}
        onBellClick={() => {
          setShowNotifications((cur) => !cur);
          setShowProfileMenu(false);
          setShowLoginModal(false);
        }}
        onProfileClick={() => {
          if (!currentUser) {
            if (onAuthNavigate) {
              onAuthNavigate('login');
              setShowProfileMenu(false);
              setShowNotifications(false);
              return;
            }
            setShowLoginModal(true);
            setShowProfileMenu(false);
          } else {
            setShowProfileMenu((cur) => !cur);
          }
          setShowNotifications(false);
        }}
      />

      {statusMessage && <div className={`statusBanner ${statusMessage.type}`}>{statusMessage.message}</div>}

      <main className="main">
        {(() => {
          switch (page) {
            case 'home':
              return <Home key={homeResetKey} onCardClick={goToPage} reports={reports} claims={claims} loading={postsLoading} isLoggedIn={!!currentUser} />;
            case 'report':
              return <LostReport onCardClick={goToPage} reports={reports} loading={postsLoading} isLoggedIn={!!currentUser} />;
            case 'claim':
              return <LostClaim onCardClick={goToPage} claims={claims} loading={postsLoading} isLoggedIn={!!currentUser} />;
            case 'notice':
              return <Notice onWrite={(pageName) => {
                if (!currentUser) {
                  showError('로그인 후 이용해주세요');
                  return;
                }
                if (!isAdmin) {
                  showError('관리자만 접근 가능합니다');
                  return;
                }
                goToPage(pageName);
              }} onOpen={(item) => goToPage('noticeDetail', item)} notices={notices} isAdmin={isAdmin} currentUser={currentUser} />;
            case 'noticeWrite':
              return <NoticeWrite
                key={selectedPost?.id || 'notice-new'}
                initialNotice={selectedPost}
                onBack={() => selectedPost ? goToPage('noticeDetail', selectedPost) : goToPage('notice')}
                onSubmit={(notice) => {
                  if (selectedPost?.id) {
                    const updated = updateNotice(selectedPost.id, notice);
                    if (updated) goToPage('noticeDetail', updated);
                    return;
                  }
                  addNotice(notice);
                  goToPage('notice');
                }}
                currentUser={currentUser}
                onRequireLogin={showError}
              />;
            case 'noticeDetail':
              return <NoticeDetail
                key={selectedPost?.id || 'notice-empty'}
                post={selectedPost}
                onBack={() => goToPage('notice')}
                addComment={addNoticeComment}
                currentUser={currentUser}
                isAdmin={isAdmin}
                onEdit={(notice) => goToPage('noticeWrite', notice)}
                onDelete={deleteNotice}
                onRequireLogin={showError}
                focusTarget={focusTarget}
              />;
            case 'reportForm':
              return <LostReportForm onSubmit={async (post) => { const ok = await addReport(post); if (ok) goToPage('report'); }} currentUser={currentUser} onRequireLogin={showError} onBack={() => goToPage('report')} />;
            case 'claimForm':
              return <LostClaimForm onSubmit={async (post) => { const ok = await addClaim(post); if (ok) goToPage('claim'); }} currentUser={currentUser} onRequireLogin={showError} onBack={() => goToPage('claim')} />;
            case 'reportDetail':
              return <DetailPage key={selectedPost?.id || 'report-empty'} post={selectedPost} type="reportDetail" onBack={() => goToPage('report')} addComment={addComment} addReply={addReply} deleteComment={deleteComment} deleteReply={deleteReply} updateComment={updateComment} updateReply={updateReply} updatePost={updatePost} deletePost={deletePost} currentUser={currentUser} isAdmin={isAdmin} onRequireLogin={showError} focusTarget={focusTarget} />;
            case 'claimDetail':
              return <DetailPage key={selectedPost?.id || 'claim-empty'} post={selectedPost} type="claimDetail" onBack={() => goToPage('claim')} addComment={addComment} addReply={addReply} deleteComment={deleteComment} deleteReply={deleteReply} updateComment={updateComment} updateReply={updateReply} updatePost={updatePost} deletePost={deletePost} currentUser={currentUser} isAdmin={isAdmin} onRequireLogin={showError} focusTarget={focusTarget} />;
            default:
              return <Home key={homeResetKey} onCardClick={goToPage} />;
          }
        })()}
      </main>

      {page === 'home' && (
        <FabMenu
          isOpen={isFabOpen}
          onToggle={() => setIsFabOpen((cur) => !cur)}
          onAction={goToPage}
        />
      )}

      {showNotifications && <NotificationDropdown currentUser={currentUser} notifications={notifications} onClear={() => markNotificationsReadForUser(currentUser)} onOpen={handleNotificationOpen} />}
      {showProfileMenu && currentUser && <ProfileMenu onSelect={handleProfileSelect} onClose={() => setShowProfileMenu(false)} />}
      {showLoginModal && (
        <div className="modalOverlay" onClick={() => { setShowLoginModal(false); setLoginName(''); }}>
          <div className="modalCard" onClick={(e) => e.stopPropagation()}>
            <div className="modalHeader">
              <h3>로그인</h3>
              <button className="modalClose" onClick={() => setShowLoginModal(false)}>
                ✕
              </button>
            </div>
            <p className="modalText">로그인할 이름을 입력해주세요.</p>
            <label className="formLabel">이름</label>
            <input
              type="text"
              placeholder="예) 홍길동"
              className="textInput"
              value={loginName}
              onChange={(e) => setLoginName(e.target.value)}
            />
            <div className="modalFooter">
              <button className="secondaryButton" onClick={() => { setShowLoginModal(false); setLoginName(''); }}>
                취소
              </button>
              <button className="primaryButton" onClick={() => handleLogin(loginName)}>
                로그인
              </button>
            </div>
          </div>
        </div>
      )}

      {showPasswordModal && (
        <div className="modalOverlay" onClick={closePasswordModal}>
          <div className="modalCard" onClick={(e) => e.stopPropagation()}>
            <div className="modalHeader">
              <h3>비밀번호 변경</h3>
              <button className="modalClose" onClick={closePasswordModal}>
                ✕
              </button>
            </div>
            <p className="modalText">안전한 계정 사용을 위해 비밀번호를 주기적으로 변경해주세요.</p>
            <label className="formLabel">현재 비밀번호</label>
            <input
              type="password"
              placeholder="비밀번호를 입력해 주세요."
              className="textInput"
              value={passwordForm.current}
              onChange={(e) => setPasswordForm((form) => ({ ...form, current: e.target.value }))}
            />
            <label className="formLabel">새 비밀번호</label>
            <input
              type="password"
              placeholder="비밀번호를 입력해 주세요."
              className="textInput"
              value={passwordForm.next}
              onChange={(e) => setPasswordForm((form) => ({ ...form, next: e.target.value }))}
            />
            <label className="formLabel">새 비밀번호 확인</label>
            <input
              type="password"
              placeholder="비밀번호를 입력해 주세요."
              className="textInput"
              value={passwordForm.confirm}
              onChange={(e) => setPasswordForm((form) => ({ ...form, confirm: e.target.value }))}
            />
            <div className="modalFooter">
              <button className="secondaryButton" onClick={closePasswordModal}>
                취소
              </button>
              <button className="primaryButton" onClick={handlePasswordChange} disabled={accountActionPending}>
                {accountActionPending ? '변경 중...' : '변경하기'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showWithdrawModal && (
        <div className="modalOverlay" onClick={() => setShowWithdrawModal(false)}>
          <div className="modalCard withdrawModal" onClick={(e) => e.stopPropagation()}>
            <div className="modalHeader">
              <h3>회원탈퇴</h3>
              <button className="modalClose" onClick={() => setShowWithdrawModal(false)}>
                ✕
              </button>
            </div>
            <p className="modalText">
              탈퇴하면 현재 계정으로 다시 이용할 수 없습니다.
              비밀번호와 확인 문구를 입력해주세요.
            </p>
            <label className="formLabel">현재 비밀번호</label>
            <input
              type="password"
              placeholder="비밀번호를 입력해 주세요."
              className="textInput"
              value={withdrawForm.password}
              onChange={(e) => setWithdrawForm((form) => ({ ...form, password: e.target.value }))}
            />
            <label className="formLabel">확인 문구</label>
            <input
              type="text"
              placeholder="탈퇴를 입력해 주세요."
              className="textInput"
              value={withdrawForm.phrase}
              onChange={(e) => setWithdrawForm((form) => ({ ...form, phrase: e.target.value }))}
            />
            <div className="modalFooter">
              <button className="secondaryButton" onClick={() => setShowWithdrawModal(false)}>
                취소
              </button>
              <button
                className="dangerButton"
                onClick={handleWithdrawConfirm}
                disabled={accountActionPending || !withdrawForm.password || withdrawForm.phrase.trim() !== '탈퇴'}
              >
                {accountActionPending ? '처리 중...' : '탈퇴하기'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
