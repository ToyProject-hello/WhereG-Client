export default function Notice({ onWrite, onOpen, notices = [], isAdmin = false }) {
  const noticeList = notices.length > 0 ? notices : Array.from({ length: 4 }, (_, index) => ({
    id: `notice-${index}`,
    title: '제목',
    description: '설명',
    date: '날짜'
  }));

  return (
    <div className="pageContent">
      <div className="pageHeader noticeHeader">
        <div>
          <h2 className="pageTitle">공지</h2>
          <p className="pageSubtitle">중요한 공지 사항을 확인하고 등록할 수 있습니다.</p>
        </div>
        {isAdmin && (
          <button className="primaryButton" onClick={() => onWrite('noticeWrite')}>
            공지 등록
          </button>
        )}
      </div>
      <div className="noticeList">
        {noticeList.map((item) => (
          <div key={item.id} className="noticeCard" onClick={() => onOpen && onOpen(item)}>
            <div className="noticeHead">
              <h3>{item.title}</h3>
              <span>{item.date}</span>
            </div>
            <p>{item.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
