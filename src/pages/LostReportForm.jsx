import { useState } from 'react';
import { LuImage, LuChevronLeft } from 'react-icons/lu';

export default function LostReportForm({ onSubmit, currentUser, onRequireLogin, onBack }) {
  const [imageData, setImageData] = useState(null);
  const [name, setName] = useState('');
  const [place, setPlace] = useState('');
  const [note, setNote] = useState('');

  const allFilled = imageData && name.trim() && place.trim() && note.trim();

  const handleFile = (file) => {
    if (!file) return setImageData(null);
    const reader = new FileReader();
    reader.onload = (e) => setImageData(e.target.result);
    reader.readAsDataURL(file);
  };

  return (
    <div className="pageContent formPage">
      <div className="formTop">
        <button className="backButton formBackButton" onClick={onBack}>
          <LuChevronLeft size={22} />
        </button>
        <h2 className="pageTitle">분실물 신고</h2>
      </div>

      <div className="formCard">
        <label className="formLabel">분실물 사진</label>
        <div className="uploadBox">
          {imageData ? (
            <img src={imageData} alt="preview" className="uploadPreview" />
          ) : (
            <>
              <LuImage className="uploadImageIcon" size={28} />
              <div className="uploadHint">사진을 추가해주세요.</div>
            </>
          )}
          <label htmlFor="reportImage" className="uploadButton">+ 사진 추가</label>
          <input
            id="reportImage"
            type="file"
            accept="image/png, image/jpeg"
            onChange={(e) => handleFile(e.target.files[0])}
            style={{ display: 'none' }}
          />
        </div>

        <label className="formLabel">분실물 이름<span className="requiredMark">*</span></label>
        <input value={name} onChange={(e) => setName(e.target.value)} type="text" placeholder="예) 에어팟 4" className="textInput" />

        <label className="formLabel">분실한 장소<span className="requiredMark">*</span></label>
        <input value={place} onChange={(e) => setPlace(e.target.value)} type="text" placeholder="예) 광주소프트웨어마이스터고등학교 운동장" className="textInput" />

        <label className="formLabel">하고 싶은 말</label>
        <input value={note} onChange={(e) => setNote(e.target.value)} type="text" placeholder="예) 찾아주시는 분께 쿠폰을 드립니다." className="textInput" />

        <button
          className={`${allFilled ? 'primaryButton' : 'disabledButton'} submitButton`}
          onClick={() => {
            if (!allFilled) return;
            if (!currentUser) {
              onRequireLogin && onRequireLogin('로그인 후 이용해주세요');
              return;
            }
            const post = {
              title: name,
              author: currentUser,
              date: new Date().toLocaleDateString('ko-KR'),
              status: '찾는중',
              image: imageData,
              place,
              note,
            };
            onSubmit && onSubmit(post);
          }}
        >
          게시하기
        </button>
      </div>
    </div>
  );
}
