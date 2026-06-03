export default function NotificationDropdown({ currentUser, notifications = null, onClear }) {
  const demo = [
    { title: '내 댓글에 답글이 달렸어요.', subtitle: '내용', time: '지금' },
    { title: '제보한 글에 새 댓글이 있어요.', subtitle: '제가 본 것 같아요', time: '10분 전' },
    { title: '제보한 글에 새 댓글이 있어요.', subtitle: '내용', time: '2시간 전' }
  ];

  const items = notifications ? (notifications.filter((n) => n.recipient === currentUser)) : demo;

  return (
    <div className="notificationDropdown">
      <div className="notificationHeader">
        <strong>알림</strong>
        <button type="button" className="notificationClear" onClick={() => onClear && onClear()}>{'모두 읽음'}</button>
      </div>
      {!currentUser || items.length === 0 ? (
        <div className="notificationItem">
          <div className="notificationTitle">아무것도 없습니다</div>
        </div>
      ) : (
        items.map((item, index) => (
          <div key={item.id || index} className="notificationItem">
            <div className="notificationTitle">{item.title}</div>
            <div className="notificationSubtitle">{item.subtitle}</div>
            <div className="notificationTime">{new Date(item.time).toLocaleString('ko-KR')}</div>
          </div>
        ))
      )}
    </div>
  );
}
