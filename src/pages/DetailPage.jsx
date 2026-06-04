import { LuChevronLeft } from 'react-icons/lu';
import { FaUserCircle } from 'react-icons/fa';

import { useState } from 'react';

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

export default function DetailPage({ type, onBack, post, addComment, addReply, deleteComment, deleteReply, updateComment, updateReply, updatePost, currentUser, isAdmin, onRequireLogin }) {
  const isReport = type === 'reportDetail';
  const statusLabel = isReport ? '찾는중' : '보관중';
  const statusValue = post?.status || statusLabel;
  const badgeClass = statusValue === '완료'
    ? 'badgeCompleted'
    : statusValue === '보관중'
      ? 'badgeKeeping'
      : 'badgeSearching';
  const postType = isReport ? 'report' : 'claim';
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

  const canEditPost = currentUser && (currentUser === post?.author || isAdmin);
  const statusOptions = isReport ? ['찾는중', '완료'] : ['보관중', '완료'];

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
    if (editStatus && updatePost) {
      updatePost(postType, post.id, { status: editStatus });
    }
  };

  const handleCommentSubmit = () => {
    const text = commentText.trim();
    if (!text || !post?.id) return;
    if (!currentUser) {
      onRequireLogin && onRequireLogin('로그인 후 이용해주세요');
      return;
    }
    const authorName = currentUser;
    addComment && addComment(postType, post.id, { author: authorName, text, time: new Date().toISOString() });
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

  const startEditReply = (commentId, reply) => {
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

  const handleReplySubmit = (commentId, parentReplyId = null) => {
    const key = parentReplyId ? `${commentId}:${parentReplyId}` : commentId;
    const text = (replyText[key] || '').trim();
    if (!text || !post?.id) return;
    if (!currentUser) {
      onRequireLogin && onRequireLogin('로그인 후 이용해주세요');
      return;
    }
    const authorName = currentUser;
    addReply && addReply(postType, post.id, commentId, { author: authorName, text, time: new Date().toISOString() }, parentReplyId);
    setReplyText((r) => ({ ...r, [key]: '' }));
    setReplyOpen((r) => ({ ...r, [key]: false }));
  };

  return (
    <div className="pageContent">
      <button className="backButton" onClick={onBack}>
        <LuChevronLeft size={18} /> 돌아가기
      </button>

      <div className="detailCard">
        <div className="detailHero">
          <div
            className="detailImage"
            style={post && post.image ? { backgroundImage: `url(${post.image})`, backgroundSize: 'cover', backgroundPosition: 'center' } : {}}
          />
          <div className="detailBody">
            <span className={`detailStatus ${badgeClass}`}>{post && post.status ? post.status : statusLabel}</span>
            <h2 className="detailTitle">{post && post.title ? post.title : '제목'}</h2>
            <div className="detailRows">
              <div className="detailRow">
                <p className="detailLabel">{isReport ? '분실 위치' : '찾은 위치'}</p>
                <p className="detailValue">{post && post.place ? post.place : '내용'}</p>
              </div>
              <div className="detailRow">
                <p className="detailLabel">{isReport ? '분실 시간' : '제보 시간'}</p>
                <p className="detailValue">{post && post.date ? post.date : '내용'}</p>
              </div>
              <div className="detailRow">
                <p className="detailLabel">작성자</p>
                <p className="detailValue">{post && post.author ? post.author : '내용'}</p>
              </div>
            </div>
            {canEditPost && (
              <div className="statusEditRow">
                <select className="textInput" value={editStatus} onChange={(e) => setEditStatus(e.target.value)}>
                  {statusOptions.map((status) => (
                    <option key={status} value={status}>{status}</option>
                  ))}
                </select>
                <button className="textAction primaryText" onClick={handleStatusSave}>상태 저장</button>
              </div>
            )}
          </div>
        </div>

        <div className="sectionDivider" />
        <div className="detailDescription">
          <h3>상세 설명</h3>
          <p className="descriptionNote">{post?.note || post?.feature || '상세 설명이 없습니다.'}</p>
        </div>

        <div className="sectionDivider" />
        <div className="commentSection">
          <div className="commentHeader">댓글 ({commentTotal})</div>

          <div>
            <textarea className="textArea" rows={3} value={commentText} onChange={(e) => setCommentText(e.target.value)} onKeyDown={handleSubmitKeyDown(handleCommentSubmit)} placeholder="댓글을 입력해 주세요." />
            <div className="commentFormActions">
              <button className="textAction greyText" onClick={() => { setCommentText(''); }}>취소</button>
              <button className={commentText.trim() ? 'textAction primaryText' : 'textAction disabledText'} onClick={handleCommentSubmit}>댓글 등록</button>
            </div>
          </div>

        {comments.map((c) => (
          <div key={c.id} style={{ marginTop: 12 }}>
            <div className="commentItem">
              <div className="commentAvatar">
                <FaUserCircle size={56} />
              </div>
              <div style={{ flex: 1 }}>
                <p className="commentName">
                  {c.author}
                  {c.author === post?.author && <span className="authorBadge">작성자</span>}
                </p>
                {editingCommentId === c.id ? (
                  <>
                    <textarea className="textArea" rows={2} value={editingCommentText} onChange={(e) => setEditingCommentText(e.target.value)} onKeyDown={handleSubmitKeyDown(() => saveEditComment(c.id))} />
                    <div className="commentFormActions">
                      <button className="textAction greyText" onClick={cancelEditComment}>취소</button>
                      <button className={editingCommentText.trim() ? 'textAction primaryText' : 'textAction disabledText'} onClick={() => saveEditComment(c.id)}>저장</button>
                    </div>
                  </>
                ) : (
                  <>
                    <p className="commentText">{c.text}</p>
                    <p className="commentTime">{getTimeAgo(c.time)}</p>
                    <div className="commentActions">
                      <button className="textAction primaryText" onClick={() => setReplyOpen((r) => ({ ...r, [c.id]: !r[c.id] }))}>답글</button>
                      {currentUser === c.author && (
                        <>
                          <button className="textAction greyText" onClick={() => startEditComment(c)}>수정</button>
                          <button className="textAction greyText" onClick={() => deleteComment && deleteComment(postType, post.id, c.id)}>삭제</button>
                        </>
                      )}
                    </div>
                  </>
                )}
                {replyOpen[c.id] && (
                  <div style={{ marginTop: 8 }}>
                    <textarea className="textArea" rows={2} value={replyText[c.id] || ''} onChange={(e) => setReplyText((r) => ({ ...r, [c.id]: e.target.value }))} onKeyDown={handleSubmitKeyDown(() => handleReplySubmit(c.id))} placeholder="답글을 입력해 주세요." />
                    <div className="commentFormActions" style={{ justifyContent: 'flex-end' }}>
                      <button className="textAction greyText" onClick={() => setReplyOpen((r) => ({ ...r, [c.id]: false }))}>취소</button>
                      <button className={(replyText[c.id] && replyText[c.id].trim()) ? 'textAction primaryText' : 'textAction disabledText'} onClick={() => handleReplySubmit(c.id)}>등록</button>
                    </div>
                  </div>
                )}

                {c.replies && c.replies.length > 0 && (
                  <div style={{ marginTop: 8, marginLeft: 54 }}>
                    {c.replies.map((rp) => (
                      <div key={rp.id} className="replyItem">
                        <div className="replyAvatar">
                          <FaUserCircle size={56} />
                        </div>
                        <div className="replyContent">
                          {editingReplyId === rp.id ? (
                            <>
                              <textarea className="textArea" rows={2} value={editingReplyText} onChange={(e) => setEditingReplyText(e.target.value)} onKeyDown={handleSubmitKeyDown(() => saveEditReply(c.id, rp.id))} />
                              <div className="commentFormActions replyFormActions">
                                <button className="textAction greyText" onClick={cancelEditReply}>취소</button>
                                <button className={editingReplyText.trim() ? 'textAction primaryText' : 'textAction disabledText'} onClick={() => saveEditReply(c.id, rp.id)}>저장</button>
                              </div>
                            </>
                          ) : (
                            <>
                              <div className="replyHeader">
                                <span className="commentName">
                                  {rp.author}
                                  {rp.author === post?.author && <span className="authorBadge">작성자</span>}
                                </span>
                                <div className="commentActions replyActions">
                                  <button className="textAction primaryText" onClick={() => setReplyOpen((r) => ({ ...r, [`${c.id}:${rp.id}`]: !r[`${c.id}:${rp.id}`] }))}>답글</button>
                                  {currentUser === rp.author && (
                                    <>
                                      <button className="textAction greyText" onClick={() => startEditReply(c.id, rp)}>수정</button>
                                      <button className="textAction greyText" onClick={() => deleteReply && deleteReply(postType, post.id, c.id, rp.id)}>삭제</button>
                                    </>
                                  )}
                                </div>
                              </div>
                              <p className="commentText">{rp.text}</p>
                              <p className="commentTime">{getTimeAgo(rp.time)}</p>
                            </>
                          )}

                          {rp.replies && rp.replies.length > 0 && (
                            <div style={{ marginTop: 8, marginLeft: 40 }}>
                              {rp.replies.map((rpp) => (
                                <div key={rpp.id} className="replyItem">
                                  <div className="replyAvatar">
                                    <FaUserCircle size={56} />
                                  </div>
                                  <div className="replyContent">
                                    <div className="replyHeader">
                                      <span className="commentName">{rpp.author}{rpp.author === post?.author && <span className="authorBadge">작성자</span>}</span>
                                      <div className="commentActions replyActions">
                                        {currentUser === rpp.author && (
                                          <>
                                            <button className="textAction greyText" onClick={() => startEditReply(c.id, rpp)}>수정</button>
                                            <button className="textAction greyText" onClick={() => deleteReply && deleteReply(postType, post.id, c.id, rpp.id)}>삭제</button>
                                          </>
                                        )}
                                      </div>
                                    </div>
                                    <p className="commentText">{rpp.text}</p>
                                    <p className="commentTime">{getTimeAgo(rpp.time)}</p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}

                          {replyOpen[`${c.id}:${rp.id}`] && (
                            <div style={{ marginTop: 8 }}>
                              <textarea className="textArea" rows={2} value={replyText[`${c.id}:${rp.id}`] || ''} onChange={(e) => setReplyText((r) => ({ ...r, [`${c.id}:${rp.id}`]: e.target.value }))} onKeyDown={handleSubmitKeyDown(() => handleReplySubmit(c.id, rp.id))} placeholder="답글을 입력해 주세요." />
                              <div className="commentFormActions" style={{ justifyContent: 'flex-end' }}>
                                <button className="textAction greyText" onClick={() => setReplyOpen((r) => ({ ...r, [`${c.id}:${rp.id}`]: false }))}>취소</button>
                                <button className={(replyText[`${c.id}:${rp.id}`] && replyText[`${c.id}:${rp.id}`].trim()) ? 'textAction primaryText' : 'textAction disabledText'} onClick={() => handleReplySubmit(c.id, rp.id)}>등록</button>
                              </div>
                            </div>
                          )}

                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
        </div>
      </div>
    </div>
  );
}
