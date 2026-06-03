import { useState } from 'react';

export default function LostClaimForm({ onSubmit, currentUser, onRequireLogin }) {
  const [imageData, setImageData] = useState(null);
  const [name, setName] = useState('');
  const [place, setPlace] = useState('');
  const [feature, setFeature] = useState('');

  const allFilled = imageData && name.trim() && place.trim() && feature.trim();

  const handleFile = (file) => {
    if (!file) return setImageData(null);
    const reader = new FileReader();
    reader.onload = (e) => setImageData(e.target.result);
    reader.readAsDataURL(file);
  };

  return (
    <div className="pageContent">
      <div className="pageHeader">
        <h2 className="pageTitle">분실물 제보</h2>
        <p className="pageSubtitle">찾은 물건의 정보를 입력해 주세요.</p>
      </div>

      <div className="formCard">
        <label className="formLabel">분실물 사진</label>
        <div className="uploadBox">
          <label htmlFor="claimImage" className="uploadButton">사진 선택</label>
          <input
            id="claimImage"
            type="file"
            accept="image/png, image/jpeg"
            onChange={(e) => handleFile(e.target.files[0])}
            style={{ display: 'none' }}
          />
          <div className="uploadHint">PNG 또는 JPEG 이미지를 업로드 해주세요.</div>
          {imageData && <img src={imageData} alt="preview" className="uploadPreview" />}
        </div>

        <label className="formLabel">분실물 이름</label>
        <input value={name} onChange={(e) => setName(e.target.value)} type="text" placeholder="예) 에어팟 4" className="textInput" />

        <label className="formLabel">찾은 장소</label>
        <input value={place} onChange={(e) => setPlace(e.target.value)} type="text" placeholder="예) 광주소프트웨어마이스터고등학교 운동장" className="textInput" />

        <label className="formLabel">특징</label>
        <input value={feature} onChange={(e) => setFeature(e.target.value)} type="text" placeholder="예) 하늘색 케이스" className="textInput" />

        <button
          className={allFilled ? 'primaryButton' : 'disabledButton'}
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
              status: '보관중',
              image: imageData,
              place,
              feature,
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
