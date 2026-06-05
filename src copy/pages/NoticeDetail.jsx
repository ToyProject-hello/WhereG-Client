import { useEffect, useState } from 'react';
import { LuChevronLeft, LuPencil, LuTrash2 } from 'react-icons/lu';
import { FaUserCircle } from 'react-icons/fa';

const escapeSelectorValue = (value) => (
  String(value).replace(/\\/g, '\\\\').replace(/"/g, '\\"')
);

const getTimeAgo = (timeString) => {
  const target = new Date(timeString);
  if (Number.isNaN(target.getTime())) return '';
  const diff = Math.floor((new Date().getTime() - target.getTime()) / 1000);
  if (diff < 10) return '방금 전';
  if (diff < 60) return `${diff}초 전`;
  if (diff < 3600) return `${Math.floor(diff / 60)}분 전`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}시간 전`;
  if (diff < 2592000) return `${Math.floor(diff / 86400)}일 전`;
  return target.toLocaleDateString('ko-KR');
};

export default function NoticeDetail({
  post,
  onBack,
  addComment,
  currentUser,
  isAdmin = false,
  onEdit,
  onDelete,
  onRequireLogin,
  focusTarget,
}) {
  const [commentText, setCommentText] = useState('');
  const comments = post?.comments || [];
  const isPlaceholderNotice = String(post?.id || '').startsWith('notice-') && !post?.author;
  const canEditNotice = Boolean(currentUser && post?.id && !isPlaceholderNotice && (isAdmin || currentUser === post?.author));

  useEffect(() => {
    if (!focusTarget || !post?.id || String(focusTarget.postId) !== String(post.id)) return undefined;

    let removeTimer = null;
    const timer = window.setTimeout(() => {
      const selector = focusTarget.commentId
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
  }, [focusTarget, post?.id, comments.length]);

  const handleCommentSubmit = () => {
    const text = commentText.trim();
    if (!text || !post?.id) return;
    if (!currentUser) {
      onRequireLogin && onRequireLogin('로그인 후 이용해주세요');
      return;
    }
    const comment = {
      author: currentUser,
      text,
      time: new Date().toISOString(),
    };
    addComment && addComment(post.id, comment);
    setCommentText('');
  };

  const handleNoticeDelete = () => {
    if (!post?.id || !onDelete) return;
    const ok = window.confirm('공지를 삭제할까요?');
    if (!ok) return;
    onDelete(post.id);
  };

  const handleSubmitKeyDown = (submit) => (event) => {
    if (event.key !== 'Enter' || event.shiftKey || event.nativeEvent.isComposing || event.keyCode === 229) return;
    event.preventDefault();
    submit();
  };

  return (
    <div className="pageContent">
      <button type="button" className="backButton" onClick={onBack}>
        <LuChevronLeft size={18} /> 돌아가기
      </button>
      <div className="detailCard">
        <div className="detailBody">
          <div className="detailTopLine">
            <h2 className="detailTitle noticeDetailTitle">{post?.title || '공지 제목 없음'}</h2>
            {canEditNotice && (
              <div className="detailActions">
                <button type="button" className="iconTextButton" onClick={() => onEdit && onEdit(post)}>
                  <LuPencil size={16} /> 수정
                </button>
                <button type="button" className="iconTextButton dangerText" onClick={handleNoticeDelete}>
                  <LuTrash2 size={16} /> 삭제
                </button>
              </div>
            )}
          </div>
          <div className="noticeDetailGrid">
            <div className="noticeDetailItem">
              <p className="detailLabel">날짜</p>
              <p className="detailValue">{post?.date || '알 수 없음'}</p>
            </div>
            <div className="noticeDetailItem">
              <p className="detailLabel">상세 내용</p>
              <p className="detailValue noticeDescription">
                {post?.description || '설명이 없습니다.'}
              </p>
            </div>
          </div>
        </div>
      </div>
      </div>
  );
}