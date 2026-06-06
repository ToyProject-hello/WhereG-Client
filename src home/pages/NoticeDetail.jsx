import { LuChevronLeft, LuPencil, LuTrash2 } from 'react-icons/lu';

export default function NoticeDetail({
  post,
  onBack,
  currentUser,
  isAdmin = false,
  onEdit,
  onDelete,
}) {
  const isPlaceholderNotice = String(post?.id || '').startsWith('notice-') && !post?.author;
  const canEditNotice = Boolean(currentUser && post?.id && !isPlaceholderNotice && (isAdmin || currentUser === post?.author));

  const handleNoticeDelete = () => {
    if (!post?.id || !onDelete) return;
    const ok = window.confirm('공지를 삭제할까요?');
    if (!ok) return;
    onDelete(post.id);
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