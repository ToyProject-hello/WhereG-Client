import { useState } from 'react';
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

const sanitizeNotifications = (items) => (
  Array.isArray(items)
    ? items.filter((item) => item && !String(item.id || '').startsWith('demo-note'))
    : []
);

export default function App() {
  const [page, setPage] = useState('home');
  const [reports, setReports] = useState(() => {
    try {
      const raw = localStorage.getItem('wg_reports');
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });
  const [claims, setClaims] = useState(() => {
    try {
      const raw = localStorage.getItem('wg_claims');
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });
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
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const raw = localStorage.getItem('wg_user');
      if (raw === 'WG_LOGGED_OUT') return null;
      return raw ? JSON.parse(raw) : '추혜인';
    } catch {
      return '추혜인';
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
  const [statusMessage, setStatusMessage] = useState('');
  const isAdmin = currentUser === '관리자' || currentUser === 'admin';
  const unreadCount = currentUser ? notifications.filter((n) => n.recipient === currentUser && !n.read).length : 0;

  const showError = (message) => {
    setStatusMessage(message);
    window.clearTimeout(window._appStatusTimer);
    window._appStatusTimer = window.setTimeout(() => setStatusMessage(''), 3000);
  };

  const goToPage = (nextPage, payload = null) => {
    if (!currentUser && ['noticeWrite', 'reportForm', 'claimForm'].includes(nextPage)) {
      showError('로그인 후 이용해주세요');
      return;
    }
    setPage(nextPage);
    setShowNotifications(false);
    setShowProfileMenu(false);
    setIsFabOpen(false);
    setSelectedPost(payload);
  };

  const addReport = (post) => {
    const next = [{ ...post, id: post.id || `r-${Date.now()}` }, ...reports];
    setReports(next);
    localStorage.setItem('wg_reports', JSON.stringify(next));
  };

  const addClaim = (post) => {
    const next = [{ ...post, id: post.id || `c-${Date.now()}` }, ...claims];
    setClaims(next);
    localStorage.setItem('wg_claims', JSON.stringify(next));
  };

  const addNotice = (notice) => {
    const next = [{ ...notice, id: notice.id || `n-${Date.now()}` }, ...notices];
    setNotices(next);
    localStorage.setItem('wg_notices', JSON.stringify(next));
  };

  const addNoticeComment = (noticeId, comment) => {
    let updatedNotice = null;
    const next = notices.map((notice) => {
      if (notice.id === noticeId) {
        const comments = notice.comments ? [...notice.comments, { ...comment, id: `ncm-${Date.now()}` }] : [{ ...comment, id: `ncm-${Date.now()}` }];
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
      addNotification(updatedNotice.author, '공지에 새 댓글이 있어요.', comment.text || updatedNotice.title || '내용');
    }
  };

  const addNotification = (recipient, title, subtitle) => {
    if (!recipient) return;
    const note = { id: `nt-${Date.now()}-${Math.random().toString(36).slice(2)}`, recipient, title, subtitle, time: new Date().toISOString(), read: false };
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

  const updatePost = (postType, postId, updates) => {
    const target = postType === 'report' ? reports : claims;
    const setter = postType === 'report' ? setReports : setClaims;
    const key = postType === 'report' ? 'wg_reports' : 'wg_claims';
    const next = target.map((p) => (p.id === postId ? { ...p, ...updates } : p));
    setter(next);
    localStorage.setItem(key, JSON.stringify(next));
    const updated = next.find((p) => p.id === postId);
    setSelectedPost(updated);
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
      addNotification(updated.author, `${postType === 'claim' ? '제보한' : '신고한'} 글에 새 댓글이 있어요.`, comment.text || updated.title || '내용');
    }
  };

  const addReply = (postType, postId, commentId, reply, parentReplyId = null) => {
    const target = postType === 'report' ? reports : claims;
    const setter = postType === 'report' ? setReports : setClaims;
    const key = postType === 'report' ? 'wg_reports' : 'wg_claims';
    let updated = null;
    let repliedComment = null;
    let notifiedAuthor = null;
    const replyId = `rpl-${Date.now()}`;
    const next = target.map((p) => {
      if (p.id === postId) {
        const comments = (p.comments || []).map((c) => {
          if (c.id === commentId) {
            repliedComment = c;
            if (!parentReplyId) {
              const newReply = { ...reply, id: replyId, replies: [] };
              const replies = [...(c.replies || []), newReply];
              notifiedAuthor = c.author;
              return { ...c, replies };
            }
            // add nested reply under a specific reply
            const replies = (c.replies || []).map((r) => {
              if (r.id === parentReplyId) {
                const newNested = { ...reply, id: replyId, replies: [] };
                const rReplies = [...(r.replies || []), newNested];
                repliedComment = r;
                notifiedAuthor = r.author;
                return { ...r, replies: rReplies };
              }
              return r;
            });
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
        repliedComment = c;
        if (!parentReplyId) {
          notifiedAuthor = c.author;
          return { ...c, replies: [...(c.replies || []), { ...reply, id: replyId, replies: [] }] };
        }
        return {
          ...c,
          replies: (c.replies || []).map((r) => (
            r.id === parentReplyId
              ? (() => {
                repliedComment = r;
                notifiedAuthor = r.author;
                return { ...r, replies: [...(r.replies || []), { ...reply, id: replyId, replies: [] }] };
              })()
              : r
          )),
        };
      }));
    } else {
      setSelectedPost(updated);
    }
    if (updated) {
      const commentObj = repliedComment || (updated.comments || []).find((c) => c.id === commentId);
      const replyRecipient = notifiedAuthor || commentObj?.author;
      if (replyRecipient && reply.author && replyRecipient !== reply.author) {
        addNotification(replyRecipient, '내 댓글에 답글이 달렸어요.', reply.text || updated.title || '내용');
      }
      if (updated.author && reply.author && updated.author !== reply.author && updated.author !== replyRecipient) {
        addNotification(updated.author, `${postType === 'claim' ? '제보한' : '신고한'} 글에 새 답글이 있어요.`, reply.text || updated.title || '내용');
      }
    }
  };

  const deleteComment = (postType, postId, commentId) => {
    const target = postType === 'report' ? reports : claims;
    const setter = postType === 'report' ? setReports : setClaims;
    const key = postType === 'report' ? 'wg_reports' : 'wg_claims';
    const post = target.find((p) => p.id === postId);
    if (!post) return;
    const comment = (post.comments || []).find((c) => c.id === commentId);
    if (!comment) return;
    if (!currentUser || comment.author !== currentUser) {
      showError('권한이 없습니다');
      return;
    }
    const next = target.map((p) => {
      if (p.id === postId) {
        const comments = (p.comments || []).filter((c) => c.id !== commentId);
        return { ...p, comments };
      }
      return p;
    });
    setter(next);
    localStorage.setItem(key, JSON.stringify(next));
    const updated = next.find((p) => p.id === postId);
    setSelectedPost(updated);
  };

  const deleteReply = (postType, postId, commentId, replyId) => {
    const target = postType === 'report' ? reports : claims;
    const setter = postType === 'report' ? setReports : setClaims;
    const key = postType === 'report' ? 'wg_reports' : 'wg_claims';
    const post = target.find((p) => p.id === postId);
    if (!post) return;
    const comment = (post.comments || []).find((c) => c.id === commentId);
    if (!comment) return;
    const reply = (comment.replies || []).find((r) => r.id === replyId);
    if (!reply) return;
    if (!currentUser || reply.author !== currentUser) {
      showError('권한이 없습니다');
      return;
    }
    const next = target.map((p) => {
      if (p.id === postId) {
        const comments = (p.comments || []).map((c) => {
          if (c.id === commentId) {
            const replies = (c.replies || []).filter((r) => r.id !== replyId);
            return { ...c, replies };
          }
          return c;
        });
        return { ...p, comments };
      }
      return p;
    });
    setter(next);
    localStorage.setItem(key, JSON.stringify(next));
    const updated = next.find((p) => p.id === postId);
    setSelectedPost(updated);
  };

  const updateComment = (postType, postId, commentId, text) => {
    const target = postType === 'report' ? reports : claims;
    const setter = postType === 'report' ? setReports : setClaims;
    const key = postType === 'report' ? 'wg_reports' : 'wg_claims';
    const post = target.find((p) => p.id === postId);
    if (!post) return;
    const comment = (post.comments || []).find((c) => c.id === commentId);
    if (!comment) return;
    if (!currentUser || comment.author !== currentUser) {
      showError('권한이 없습니다');
      return;
    }
    const next = target.map((p) => {
      if (p.id === postId) {
        const comments = (p.comments || []).map((c) => (c.id === commentId ? { ...c, text } : c));
        return { ...p, comments };
      }
      return p;
    });
    setter(next);
    localStorage.setItem(key, JSON.stringify(next));
    const updated = next.find((p) => p.id === postId);
    setSelectedPost(updated);
  };

  const updateReply = (postType, postId, commentId, replyId, text) => {
    const target = postType === 'report' ? reports : claims;
    const setter = postType === 'report' ? setReports : setClaims;
    const key = postType === 'report' ? 'wg_reports' : 'wg_claims';
    const post = target.find((p) => p.id === postId);
    if (!post) return;
    const comment = (post.comments || []).find((c) => c.id === commentId);
    if (!comment) return;
    const reply = (comment.replies || []).find((r) => r.id === replyId);
    if (!reply) return;
    if (!currentUser || reply.author !== currentUser) {
      showError('권한이 없습니다');
      return;
    }
    const next = target.map((p) => {
      if (p.id === postId) {
        const comments = (p.comments || []).map((c) => {
          if (c.id === commentId) {
            const replies = (c.replies || []).map((r) => (r.id === replyId ? { ...r, text } : r));
            return { ...c, replies };
          }
          return c;
        });
        return { ...p, comments };
      }
      return p;
    });
    setter(next);
    localStorage.setItem(key, JSON.stringify(next));
    const updated = next.find((p) => p.id === postId);
    setSelectedPost(updated);
  };

  const getActivePage = () => {
    if (page === 'noticeWrite' || page === 'notice' || page === 'noticeDetail') return 'notice';
    if (page === 'report' || page === 'reportForm' || page === 'reportDetail') return 'report';
    if (page === 'claim' || page === 'claimForm' || page === 'claimDetail') return 'claim';
    return 'home';
  };

  const handleProfileSelect = (action) => {
    if (action === 'password') {
      setPasswordForm({ current: '', next: '', confirm: '' });
      setShowPasswordModal(true);
    }
    setShowProfileMenu(false);
    if (action === 'logout') {
      setCurrentUser(null);
      localStorage.setItem('wg_user', 'WG_LOGGED_OUT');
      setPage('home');
      showError('로그아웃되었습니다');
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

  const handlePasswordChange = () => {
    if (!passwordForm.current || !passwordForm.next || !passwordForm.confirm) {
      showError('모든 항목을 입력해주세요');
      return;
    }
    if (passwordForm.next !== passwordForm.confirm) {
      showError('새 비밀번호가 일치하지 않습니다');
      return;
    }
    closePasswordModal();
    showError('비밀번호가 변경되었습니다');
  };

  const handleWithdrawConfirm = () => {
    if (!withdrawForm.password || withdrawForm.phrase.trim() !== '탈퇴') {
      showError('비밀번호와 확인 문구를 입력해주세요');
      return;
    }
    setCurrentUser(null);
    localStorage.setItem('wg_user', 'WG_LOGGED_OUT');
    setShowWithdrawModal(false);
    setShowPasswordModal(false);
    setWithdrawForm({ password: '', phrase: '' });
    setShowNotifications(false);
    setPage('home');
    showError('회원탈퇴가 완료되었습니다');
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
            setShowLoginModal(true);
            setShowProfileMenu(false);
          } else {
            setShowProfileMenu((cur) => !cur);
          }
          setShowNotifications(false);
        }}
      />

      {statusMessage && <div className="statusBanner">{statusMessage}</div>}

      <main className="main">
        {(() => {
          switch (page) {
            case 'home':
              return <Home onCardClick={goToPage} reports={reports} claims={claims} />;
            case 'report':
              return <LostReport onCardClick={goToPage} reports={reports} />;
            case 'claim':
              return <LostClaim onCardClick={goToPage} claims={claims} />;
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
              return <NoticeWrite onSubmit={(notice) => { addNotice(notice); goToPage('notice'); }} currentUser={currentUser} onRequireLogin={showError} />;
            case 'noticeDetail':
              return <NoticeDetail post={selectedPost} onBack={() => goToPage('notice')} addComment={addNoticeComment} currentUser={currentUser} onRequireLogin={showError} />;
            case 'reportForm':
              return <LostReportForm onSubmit={(post) => { addReport(post); goToPage('report'); }} currentUser={currentUser} onRequireLogin={showError} onBack={() => goToPage('report')} />;
            case 'claimForm':
              return <LostClaimForm onSubmit={(post) => { addClaim(post); goToPage('claim'); }} currentUser={currentUser} onRequireLogin={showError} onBack={() => goToPage('claim')} />;
            case 'reportDetail':
              return <DetailPage post={selectedPost} type="reportDetail" onBack={() => goToPage('report')} addComment={addComment} addReply={addReply} deleteComment={deleteComment} deleteReply={deleteReply} updateComment={updateComment} updateReply={updateReply} updatePost={updatePost} currentUser={currentUser} isAdmin={isAdmin} onRequireLogin={showError} />;
            case 'claimDetail':
              return <DetailPage post={selectedPost} type="claimDetail" onBack={() => goToPage('claim')} addComment={addComment} addReply={addReply} deleteComment={deleteComment} deleteReply={deleteReply} updateComment={updateComment} updateReply={updateReply} updatePost={updatePost} currentUser={currentUser} isAdmin={isAdmin} onRequireLogin={showError} />;
            default:
              return <Home onCardClick={goToPage} />;
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

      {showNotifications && <NotificationDropdown currentUser={currentUser} notifications={notifications} onClear={() => markNotificationsReadForUser(currentUser)} />}
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
              <button className="primaryButton" onClick={handlePasswordChange}>
                변경하기
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
                disabled={!withdrawForm.password || withdrawForm.phrase.trim() !== '탈퇴'}
              >
                탈퇴하기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
