import { useState } from 'react';
import { LuChevronLeft } from 'react-icons/lu';

export default function NoticeWrite({ onSubmit, currentUser, initialNotice = null, onBack }) {
  const [title, setTitle] = useState(initialNotice?.title || '');
  const [content, setContent] = useState(initialNotice?.description || '');

  const allFilled = title.trim() && content.trim();
  const isEditing = Boolean(initialNotice?.id);

  return (
    <div className="pageContent formPage">
      <div className="formTop noticeFormTop">
        {onBack && (
          <button type="button" className="backButton formBackButton" onClick={onBack}>
            <LuChevronLeft size={22} />
          </button>
        )}
        <div>
          <h2 className="pageTitle">{isEditing ? '공지 수정' : '공지 등록'}</h2>
          <p className="pageSubtitle">공지 제목과 내용을 입력한 후 저장해주세요.</p>
        </div>
      </div>

      <div className="formCard noticeForm">
        <label className="formLabel">공지 제목</label>
        <input value={title} onChange={(e) => setTitle(e.target.value)} type="text" placeholder="공지 제목을 입력해 주세요." className="textInput" />

        <label className="formLabel">공지 내용</label>
        <textarea value={content} onChange={(e) => setContent(e.target.value)} placeholder="공지 내용을 입력해 주세요." className="textArea" rows="8" />

        <button className={allFilled ? 'primaryButton' : 'disabledButton'} onClick={() => {
          if (!allFilled) return;
          const notice = {
            ...initialNotice,
            title: title.trim(),
            description: content.trim(),
            date: initialNotice?.date || new Date().toLocaleDateString('ko-KR'),
            author: initialNotice?.author || currentUser || '관리자',
          };
          onSubmit && onSubmit(notice);
        }}>
          {isEditing ? '저장하기' : '게시하기'}
        </button>
      </div>
    </div>
  );
}
