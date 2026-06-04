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
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [loginName, setLoginName] = useState('');
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const isAdmin = currentUser === '관리자' || currentUser === 'admin';

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
    const next = notices.map((notice) => {
      if (notice.id === noticeId) {
        const comments = notice.comments ? [...notice.comments, { ...comment, id: `ncm-${Date.now()}` }] : [{ ...comment, id: `ncm-${Date.now()}` }];
        return { ...notice, comments };
      }
      return notice;
    });
    setNotices(next);
    localStorage.setItem('wg_notices', JSON.stringify(next));
    const updated = next.find((notice) => notice.id === noticeId);
    if (updated) setSelectedPost(updated);
  };

  const addNotification = (recipient, title, subtitle) => {
    if (!recipient) return;
    const note = { id: `nt-${Date.now()}`, recipient, title, subtitle, time: new Date().toISOString(), read: false };
    const next = [note, ...notifications];
    setNotifications(next);
    try { localStorage.setItem('wg_notifications', JSON.stringify(next)); } catch {
      // Ignore storage failures so comments still update in memory.
    }
  };

  const clearNotificationsForUser = (user) => {
    if (!user) return;
    const next = (notifications || []).filter((n) => n.recipient !== user);
    setNotifications(next);
    try { localStorage.setItem('wg_notifications', JSON.stringify(next)); } catch {
      // Ignore storage failures so the notification menu can still clear.
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
    const next = target.map((p) => {
      if (p.id === postId) {
        const comments = p.comments ? [...p.comments, { ...comment, id: `cm-${Date.now()}`, replies: [] }] : [{ ...comment, id: `cm-${Date.now()}`, replies: [] }];
        return { ...p, comments };
      }
      return p;
    });
    setter(next);
    localStorage.setItem(key, JSON.stringify(next));
    const updated = next.find((p) => p.id === postId);
    setSelectedPost(updated);
    // 알림: 내 게시물에 댓글이 달렸을 때 (작성자 본인 제외)
    if (updated && updated.author && comment.author && updated.author !== comment.author) {
      addNotification(updated.author, '내 게시물에 새 댓글이 달렸습니다.', updated.title || '')
    }
  };

  const addReply = (postType, postId, commentId, reply, parentReplyId = null) => {
    const target = postType === 'report' ? reports : claims;
    const setter = postType === 'report' ? setReports : setClaims;
    const key = postType === 'report' ? 'wg_reports' : 'wg_claims';
    const next = target.map((p) => {
      if (p.id === postId) {
        const comments = (p.comments || []).map((c) => {
          if (c.id === commentId) {
            if (!parentReplyId) {
              const newReply = { ...reply, id: `rpl-${Date.now()}`, replies: [] };
              const replies = [...(c.replies || []), newReply];
              return { ...c, replies };
            }
            // add nested reply under a specific reply
            const replies = (c.replies || []).map((r) => {
              if (r.id === parentReplyId) {
                const newNested = { ...reply, id: `rpl-${Date.now()}`, replies: [] };
                const rReplies = [...(r.replies || []), newNested];
                return { ...r, replies: rReplies };
              }
              return r;
            });
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
    // 알림: 내 댓글에 대댓글이 달렸을 때 (댓글 작성자 본인 제외)
    if (updated) {
      const commentObj = (updated.comments || []).find((c) => c.id === commentId);
      if (commentObj && commentObj.author && reply.author && commentObj.author !== reply.author) {
        addNotification(commentObj.author, '내 댓글에 새 답글이 달렸습니다.', updated.title || '');
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
      setShowPasswordModal(true);
    }
    setShowProfileMenu(false);
    if (action === 'logout') {
      setCurrentUser(null);
      localStorage.setItem('wg_user', 'WG_LOGGED_OUT');
      setPage('home');
    }
    if (action === 'withdraw') {
      setCurrentUser(null);
      localStorage.setItem('wg_user', 'WG_LOGGED_OUT');
      setPage('home');
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

      <FabMenu
        isOpen={isFabOpen}
        onToggle={() => setIsFabOpen((cur) => !cur)}
        onAction={goToPage}
      />

      {showNotifications && <NotificationDropdown currentUser={currentUser} notifications={notifications} onClear={() => clearNotificationsForUser(currentUser)} />}
      {showProfileMenu && currentUser && <ProfileMenu onSelect={handleProfileSelect} />}
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
        <div className="modalOverlay" onClick={() => setShowPasswordModal(false)}>
          <div className="modalCard" onClick={(e) => e.stopPropagation()}>
            <div className="modalHeader">
              <h3>비밀번호 변경</h3>
              <button className="modalClose" onClick={() => setShowPasswordModal(false)}>
                ✕
              </button>
            </div>
            <p className="modalText">안전한 계정 사용을 위해 비밀번호를 주기적으로 변경해주세요.</p>
            <label className="formLabel">현재 비밀번호</label>
            <input type="password" placeholder="비밀번호를 입력해 주세요." className="textInput" />
            <label className="formLabel">새 비밀번호</label>
            <input type="password" placeholder="비밀번호를 입력해 주세요." className="textInput" />
            <label className="formLabel">새 비밀번호 확인</label>
            <input type="password" placeholder="비밀번호를 입력해 주세요." className="textInput" />
            <div className="modalFooter">
              <button className="secondaryButton" onClick={() => setShowPasswordModal(false)}>
                취소
              </button>
              <button className="primaryButton" onClick={() => setShowPasswordModal(false)}>
                변경하기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
