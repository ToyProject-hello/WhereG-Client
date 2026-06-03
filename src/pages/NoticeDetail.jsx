import { LuChevronLeft } from 'react-icons/lu';
import { useState } from 'react';

export default function NoticeDetail({ post, onBack, addComment, currentUser, onRequireLogin }) {
  const [commentText, setCommentText] = useState('');

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

  return (
    <div className="pageContent">
      <button className="backButton" onClick={onBack}>
        <LuChevronLeft size={18} /> 돌아가기
      </button>
      <div className="detailCard">
        <div className="detailBody">
          <h2 className="detailTitle">{post?.title || '공지 제목 없음'}</h2>
          <div className="detailGrid">
            <div>
              <p className="detailLabel">날짜</p>
              <p className="detailValue">{post?.date || '알 수 없음'}</p>
            </div>
            <div>
              <p className="detailLabel">상세 내용</p>
              <p className="detailValue" style={{ whiteSpace: 'pre-wrap', fontWeight: 400, color: '#4a5568' }}>
                {post?.description || '설명이 없습니다.'}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="sectionDivider" />
      <div className="commentSection">
        <div className="commentHeader">댓글 ({(post?.comments || []).length})</div>
        <div>
          <textarea className="textArea" rows={3} value={commentText} onChange={(e) => setCommentText(e.target.value)} placeholder="댓글을 입력해 주세요." />
          <div className="commentFormActions">
            <button className="textAction" onClick={() => setCommentText('')}>취소</button>
            <button className={commentText.trim() ? 'textAction primaryText' : 'textAction disabledText'} onClick={handleCommentSubmit}>댓글 등록</button>
          </div>
        </div>
        {(post?.comments || []).map((c) => (
          <div key={c.id} style={{ marginTop: 12 }}>
            <div className="commentItem">
              <div className="commentAvatar" />
              <div style={{ flex: 1 }}>
                <p className="commentName">{c.author}</p>
                <p className="commentText">{c.text}</p>
                <p className="commentTime">{new Date(c.time).toLocaleString('ko-KR')}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
