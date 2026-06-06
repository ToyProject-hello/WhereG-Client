import { useEffect, useState, useRef } from 'react';
import { LuCheck, LuChevronLeft, LuPencil, LuSave, LuTrash2, LuX } from 'react-icons/lu';
import { FaUserCircle } from 'react-icons/fa';

const getTimeAgo = (timeString) => {
  const now = new Date();
  let target = new Date(timeString);
  if (Number.isNaN(target.getTime())) {
    target = new Date();
  }
  const diff = Math.floor((now - target) / 1000);
  if (diff < 10) return '방금 전';
  if (diff < 60) return `${diff}초 전`;
  if (diff < 3600) return `${Math.floor(diff / 60)}분 전`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}시간 전`;
  if (diff < 2592000) return `${Math.floor(diff / 86400)}일 전`;
  return target.toLocaleDateString('ko-KR');
};

const escapeSelectorValue = (value) => CSS.escape(String(value));

const getPostEditForm = (post, isReport) => ({
  title: post?.title || '',
  place: post?.place || '',
  date: post?.date || '',
  description: isReport ? (post?.note || '') : (post?.feature || ''),
});

export default function DetailPage({
  type,
  onBack,
  post,
  addComment,
  addReply,
  deleteComment,
  deleteReply,
  updateComment,
  updateReply,
  updatePost,
  deletePost,
  currentUser,
  isAdmin,
  onRequireLogin,
  focusTarget,
}) {

  const statusTimerRef = useRef(null);
  useEffect(() => {
    return () => {
      if (statusTimerRef.current) {
        clearTimeout(statusTimerRef.current);
      }
    };
  }, []);

  const isReport = type === 'reportDetail';
  const statusLabel = isReport ? '찾는중' : '보관중';
  const statusValue = post?.status || statusLabel;
  const badgeClass = statusValue === '완료'
    ? 'badgeCompleted'
    : statusValue === '보관중'
      ? 'badgeKeeping'
      : 'badgeSearching';
  const postType = isReport ? 'report' : 'claim';
  const descriptionKey = isReport ? 'note' : 'feature';
  const descriptionLabel = isReport ? '하고 싶은 말' : '특징';
  const placeLabel = isReport ? '분실 위치' : '찾은 위치';
  const dateLabel = isReport ? '분실 시간' : '제보 시간';
  const isPlaceholderPost = /^(report|claim)-\d+$/.test(String(post?.id || '')) && !post?.place && !post?.image;
  const comments = post?.comments || [];
  const countReplies = (replies = []) => (
    replies.reduce((total, reply) => total + 1 + countReplies(reply.replies || []), 0)
  );
  const commentTotal = comments.reduce((total, comment) => total + 1 + countReplies(comment.replies || []), 0);

  const [commentText, setCommentText] = useState('');
  const [replyText, setReplyText] = useState({});
  const [replyOpen, setReplyOpen] = useState({});
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editingCommentText, setEditingCommentText] = useState('');
  const [editingReplyId, setEditingReplyId] = useState(null);
  const [editingReplyText, setEditingReplyText] = useState('');
  const [editStatus, setEditStatus] = useState(statusValue);
  const [statusSaved, setStatusSaved] = useState(false);
  const [postEditOpen, setPostEditOpen] = useState(false);
  const [postEditForm, setPostEditForm] = useState(() => getPostEditForm(post, isReport));

  const canEditPost = Boolean(currentUser && post?.id && !isPlaceholderPost && (currentUser === post?.author || isAdmin));
  const statusOptions = isReport ? ['찾는중', '완료'] : ['보관중', '완료'];
  const isPostFormReady = postEditForm.title.trim() && postEditForm.place.trim();

  useEffect(() => {
    if (!focusTarget || !post?.id || String(focusTarget.postId) !== String(post.id)) return undefined;

    let removeTimer = null;
    const timer = window.setTimeout(() => {
      const selector = focusTarget.replyId
        ? `[data-reply-id="${escapeSelectorValue(focusTarget.replyId)}"]`
        : focusTarget.commentId
          ? `[data-comment-id="${escapeSelectorValue(focusTarget.commentId)}"]`
          : '.commentSection';
      const element = document.querySelector(selector) || document.querySelector('.commentSection');
      if (!element) return;
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      element.classList.add('commentFocusPulse');
      removeTimer = window.setTimeout(() => element.classList.remove('commentFocusPulse'), 1600);
    }, 120);

    return () => {
      window.clearTimeout(timer);
      if (removeTimer) window.clearTimeout(removeTimer);
    };
  }, [focusTarget, post?.id, commentTotal]);

  const handleSubmitKeyDown = (submit) => (event) => {
    if (event.key !== 'Enter' || event.shiftKey || event.nativeEvent.isComposing || event.keyCode === 229) return;
    event.preventDefault();
    submit();
  };

  const handleStatusSave = () => {
    if (!post?.id) return;
    if (!canEditPost) {
      onRequireLogin && onRequireLogin('수정 권한이 없습니다');
      return;
    }
    if (!editStatus || editStatus === statusValue) return;
    const updated = updatePost && updatePost(postType, post.id, { status: editStatus });
    if (updated) {
      setStatusSaved(true);
      if (statusTimerRef.current) {
        window.clearTimeout(statusTimerRef.current);
      }
      statusTimerRef.current = window.setTimeout(() => setStatusSaved(false), 1800);
    }
  };

  const handlePostEditSave = () => {
    if (!post?.id || !isPostFormReady) return;
    const updates = {
      title: postEditForm.title.trim(),
      place: postEditForm.place.trim(),
      date: postEditForm.date.trim() || post?.date,
      [descriptionKey]: postEditForm.description.trim(),
    };
    const updated = updatePost && updatePost(postType, post.id, updates);
    if (updated) setPostEditOpen(false);
  };

  const handlePostDelete = () => {
    if (!post?.id || !deletePost) return;
    const ok = window.confirm('게시물을 삭제할까요?');
    if (!ok) return;
    deletePost(postType, post.id);
  };

  const handleCommentSubmit = () => {
    const text = commentText.trim();
    if (!text || !post?.id) return;
    if (!currentUser) {
      onRequireLogin && onRequireLogin('로그인 후 이용해주세요');
      return;
    }
    addComment && addComment(postType, post.id, { author: currentUser, text, time: new Date().toISOString() });
    setCommentText('');
  };

  const startEditComment = (comment) => {
    if (!currentUser || currentUser !== comment.author) {
      onRequireLogin && onRequireLogin('본인만 수정/삭제 가능합니다');
      return;
    }
    setEditingCommentId(comment.id);
    setEditingCommentText(comment.text);
    setEditingReplyId(null);
  };

  const cancelEditComment = () => {
    setEditingCommentId(null);
    setEditingCommentText('');
  };

  const saveEditComment = (commentId) => {
    const text = editingCommentText.trim();
    if (!text || !post?.id) return;
    updateComment && updateComment(postType, post.id, commentId, text);
    cancelEditComment();
  };

  const startEditReply = (reply) => {
    if (!currentUser || currentUser !== reply.author) {
      onRequireLogin && onRequireLogin('본인만 수정/삭제 가능합니다');
      return;
    }
    setEditingReplyId(reply.id);
    setEditingReplyText(reply.text);
    setEditingCommentId(null);
  };

  const cancelEditReply = () => {
    setEditingReplyId(null);
    setEditingReplyText('');
  };

  const saveEditReply = (commentId, replyId) => {
    const text = editingReplyText.trim();
    if (!text || !post?.id) return;
    updateReply && updateReply(postType, post.id, commentId, replyId, text);
    cancelEditReply();
  };

  const getReplyKey = (commentId, replyId) => `${commentId}:${replyId}`;

  const handleReplySubmit = (commentId, parentReplyId = null) => {
    const key = parentReplyId ? getReplyKey(commentId, parentReplyId) : commentId;
    const text = (replyText[key] || '').trim();
    if (!text || !post?.id) return;
    if (!currentUser) {
      onRequireLogin && onRequireLogin('로그인 후 이용해주세요');
      return;
    }
    addReply && addReply(postType, post.id, commentId, { author: currentUser, text, time: new Date().toISOString() }, parentReplyId);
    setReplyText((r) => ({ ...r, [key]: '' }));
    setReplyOpen((r) => ({ ...r, [key]: false }));
  };

  const renderReplies = (replies = [], commentId) => {
    if (!replies.length) return null;

    return (
      <div className="replyList">
        {replies.map((reply) => {
          const key = getReplyKey(commentId, reply.id);
          const isEditing = editingReplyId === reply.id;

          return (
            <div key={reply.id} className="replyItem" data-reply-id={reply.id}>
              <div className="replyAvatar">
                <FaUserCircle size={56} />
              </div>
              <div className="replyContent">
                {isEditing ? (
                  <>
                    <textarea className="textArea" rows={2} value={editingReplyText} onChange={(e) => setEditingReplyText(e.target.value)} onKeyDown={handleSubmitKeyDown(() => saveEditReply(commentId, reply.id))} />
                    <div className="commentFormActions replyFormActions">
                      <button type="button" className="textAction greyText" onClick={cancelEditReply}>취소</button>
                      <button type="button" className={editingReplyText.trim() ? 'textAction primaryText' : 'textAction disabledText'} onClick={() => saveEditReply(commentId, reply.id)}>저장</button>
                    </div>
                  </>
                ) : (
                  <>
                    <p className="commentName">
                      {reply.author}
                      {reply.author === post?.author && <span className="authorBadge">작성자</span>}
                    </p>
                    <p className="commentText">{reply.text}</p>
                    <p className="commentTime">{getTimeAgo(reply.time)}</p>
                    <div className="commentActions replyActionsInline">
                      <button type="button" className="textAction primaryText" onClick={() => setReplyOpen((r) => ({ ...r, [key]: !r[key] }))}>답글</button>
                      {currentUser === reply.author && (
                        <>
                          <button type="button" className="textAction greyText" onClick={() => startEditReply(reply)}>수정</button>
                          <button type="button" className="textAction greyText" onClick={() => deleteReply && deleteReply(postType, post.id, commentId, reply.id)}>삭제</button>
                        </>
                      )}
                    </div>
                  </>
                )}

                {replyOpen[key] && (
                  <div className="replyForm">
                    <textarea className="textArea" rows={2} value={replyText[key] || ''} onChange={(e) => setReplyText((r) => ({ ...r, [key]: e.target.value }))} onKeyDown={handleSubmitKeyDown(() => handleReplySubmit(commentId, reply.id))} placeholder="답글을 입력해 주세요." />
                    <div className="commentFormActions replyFormActions">
                      <button type="button" className="textAction greyText" onClick={() => setReplyOpen((r) => ({ ...r, [key]: false }))}>취소</button>
                      <button type="button" className={(replyText[key] && replyText[key].trim()) ? 'textAction primaryText' : 'textAction disabledText'} onClick={() => handleReplySubmit(commentId, reply.id)}>등록</button>
                    </div>
                  </div>
                )}

                {renderReplies(reply.replies || [], commentId)}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="pageContent">
      <button type="button" className="backButton" onClick={onBack}>
        <LuChevronLeft size={18} /> 돌아가기
      </button>

      <div className="detailCard">
        <div className="detailHero">
          <div
            className="detailImage"
            style={post && post.image ? { backgroundImage: `url(${post.image})`, backgroundSize: 'cover', backgroundPosition: 'center' } : {}}
          />
          <div className="detailBody">
            <div className="detailTopLine">
              <span className={`detailStatus ${badgeClass}`}>{statusValue}</span>
              {canEditPost && !postEditOpen && (
                <div className="detailActions">
                  <button type="button" className="iconTextButton" onClick={() => setPostEditOpen(true)}>
                    <LuPencil size={16} /> 수정
                  </button>
                  <button type="button" className="iconTextButton dangerText" onClick={handlePostDelete}>
                    <LuTrash2 size={16} /> 삭제
                  </button>
                </div>
              )}
            </div>

            {postEditOpen ? (
              <div className="postEditPanel">
                <div className="postEditGrid">
                  <label className="formLabel">분실물 이름</label>
                  <input className="textInput" value={postEditForm.title} onChange={(e) => setPostEditForm((form) => ({ ...form, title: e.target.value }))} />

                  <label className="formLabel">{placeLabel}</label>
                  <input className="textInput" value={postEditForm.place} onChange={(e) => setPostEditForm((form) => ({ ...form, place: e.target.value }))} />

                  <label className="formLabel">{dateLabel}</label>
                  <input className="textInput" value={postEditForm.date} onChange={(e) => setPostEditForm((form) => ({ ...form, date: e.target.value }))} />

                  <label className="formLabel">{descriptionLabel}</label>
                  <textarea className="textArea" rows={3} value={postEditForm.description} onChange={(e) => setPostEditForm((form) => ({ ...form, description: e.target.value }))} />
                </div>
                <div className="postEditActions">
                  <button type="button" className="iconTextButton" onClick={() => { setPostEditOpen(false); setPostEditForm(getPostEditForm(post, isReport)); }}>
                    <LuX size={16} /> 취소
                  </button>
                  <button type="button" className={isPostFormReady ? 'iconTextButton primaryFilledButton' : 'iconTextButton disabledFilledButton'} onClick={handlePostEditSave}>
                    <LuSave size={16} /> 저장
                  </button>
                </div>
              </div>
            ) : (
              <>
                <h2 className="detailTitle">{post?.title || '제목'}</h2>
                <div className="detailRows">
                  <div className="detailRow">
                    <p className="detailLabel">{placeLabel}</p>
                    <p className="detailValue">{post?.place || '내용'}</p>
                  </div>
                  <div className="detailRow">
                    <p className="detailLabel">{dateLabel}</p>
                    <p className="detailValue">{post?.date || '내용'}</p>
                  </div>
                  <div className="detailRow">
                    <p className="detailLabel">작성자</p>
                    <p className="detailValue">{post?.author || '내용'}</p>
                  </div>
                </div>
              </>
            )}

            {canEditPost && (
              <div className="statusEditRow">
                <span className="statusEditLabel">상태</span>
                <div className="statusSegment" role="group" aria-label="게시물 상태">
                  {statusOptions.map((status) => (
                    <button
                      key={status}
                      type="button"
                      className={`statusSegmentButton ${editStatus === status ? 'active' : ''}`}
                      onClick={() => setEditStatus(status)}
                    >
                      {status}
                    </button>
                  ))}
                </div>
                <button type="button" className="statusSaveButton" onClick={handleStatusSave} disabled={editStatus === statusValue}>
                  <LuCheck size={16} /> 상태 저장
                </button>
                {statusSaved && <span className="statusSavedText">저장됨</span>}
              </div>
            )}
          </div>
        </div>

        <div className="sectionDivider" />
        <div className="detailDescription">
          <h3>상세 설명</h3>
          <p className="descriptionNote">{post?.[descriptionKey] || '상세 설명이 없습니다.'}</p>
        </div>

        <div className="sectionDivider" />
        <div className="commentSection">
          <div className="commentHeader">댓글 ({commentTotal})</div>

          <div>
            <textarea className="textArea" rows={3} value={commentText} onChange={(e) => setCommentText(e.target.value)} onKeyDown={handleSubmitKeyDown(handleCommentSubmit)} placeholder="댓글을 입력해 주세요." />
            <div className="commentFormActions">
              <button type="button" className="textAction greyText" onClick={() => { setCommentText(''); }}>취소</button>
              <button type="button" className={commentText.trim() ? 'textAction primaryText' : 'textAction disabledText'} onClick={handleCommentSubmit}>댓글 등록</button>
            </div>
          </div>

          {comments.map((c) => (
            <div key={c.id} className="commentBlock">
              <div className="commentItem" data-comment-id={c.id}>
                <div className="commentAvatar">
                  <FaUserCircle size={56} />
                </div>
                <div className="commentContent">
                  <p className="commentName">
                    {c.author}
                    {c.author === post?.author && <span className="authorBadge">작성자</span>}
                  </p>
                  {editingCommentId === c.id ? (
                    <>
                      <textarea className="textArea" rows={2} value={editingCommentText} onChange={(e) => setEditingCommentText(e.target.value)} onKeyDown={handleSubmitKeyDown(() => saveEditComment(c.id))} />
                      <div className="commentFormActions">
                        <button type="button" className="textAction greyText" onClick={cancelEditComment}>취소</button>
                        <button type="button" className={editingCommentText.trim() ? 'textAction primaryText' : 'textAction disabledText'} onClick={() => saveEditComment(c.id)}>저장</button>
                      </div>
                    </>
                  ) : (
                    <>
                      <p className="commentText">{c.text}</p>
                      <p className="commentTime">{getTimeAgo(c.time)}</p>
                      <div className="commentActions">
                        <button type="button" className="textAction primaryText" onClick={() => setReplyOpen((r) => ({ ...r, [c.id]: !r[c.id] }))}>답글</button>
                        {currentUser === c.author && (
                          <>
                            <button type="button" className="textAction greyText" onClick={() => startEditComment(c)}>수정</button>
                            <button type="button" className="textAction greyText" onClick={() => deleteComment && deleteComment(postType, post.id, c.id)}>삭제</button>
                          </>
                        )}
                      </div>
                    </>
                  )}

                  {replyOpen[c.id] && (
                    <div className="replyForm">
                      <textarea className="textArea" rows={2} value={replyText[c.id] || ''} onChange={(e) => setReplyText((r) => ({ ...r, [c.id]: e.target.value }))} onKeyDown={handleSubmitKeyDown(() => handleReplySubmit(c.id))} placeholder="답글을 입력해 주세요." />
                      <div className="commentFormActions replyFormActions">
                        <button type="button" className="textAction greyText" onClick={() => setReplyOpen((r) => ({ ...r, [c.id]: false }))}>취소</button>
                        <button type="button" className={(replyText[c.id] && replyText[c.id].trim()) ? 'textAction primaryText' : 'textAction disabledText'} onClick={() => handleReplySubmit(c.id)}>등록</button>
                      </div>
                    </div>
                  )}

                  {renderReplies(c.replies || [], c.id)}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
