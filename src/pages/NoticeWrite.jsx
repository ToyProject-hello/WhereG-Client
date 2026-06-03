import { useState } from 'react';

export default function NoticeWrite({ onSubmit, currentUser, onRequireLogin }) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');

  const allFilled = title.trim() && content.trim();

  return (
    <div className="pageContent">
      <div className="pageHeader">
        <h2 className="pageTitle">공지 등록</h2>
        <p className="pageSubtitle">공지 제목과 내용을 입력한 후 게시하기 버튼을 눌러주세요.</p>
      </div>

      <div className="formCard noticeForm">
        <label className="formLabel">공지 제목</label>
        <input value={title} onChange={(e) => setTitle(e.target.value)} type="text" placeholder="공지 제목을 입력해 주세요." className="textInput" />

        <label className="formLabel">공지 내용</label>
        <textarea value={content} onChange={(e) => setContent(e.target.value)} placeholder="공지 내용을 입력해 주세요." className="textArea" rows="8" />

        <button className={allFilled ? 'primaryButton' : 'disabledButton'} onClick={() => {
          if (!allFilled) return;
          const notice = {
            title: title.trim(),
            description: content.trim(),
            date: new Date().toLocaleDateString('ko-KR')
          };
          onSubmit && onSubmit(notice);
        }}>
          게시하기
        </button>
      </div>
    </div>
  );
}
