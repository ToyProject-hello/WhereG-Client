export default function NotificationDropdown({ currentUser, notifications = null, onClear }) {
  const demo = [
    { title: '내 댓글에 답글이 달렸어요.', subtitle: '내용', timeLabel: '시간' },
    { title: '제보한 글에 새 댓글이 있어요.', subtitle: '제가 본 것 같아요', timeLabel: '10분 전' },
    { title: '제보한 글에 새 댓글이 있어요.', subtitle: '내용', timeLabel: '시간' }
  ];

  const formatTime = (time) => {
    if (!time) return '시간';
    const date = new Date(time);
    if (Number.isNaN(date.getTime())) return time;
    return date.toLocaleString('ko-KR');
  };

  const userItems = notifications ? notifications.filter((n) => n.recipient === currentUser) : [];
  const items = notifications === null ? demo : userItems;

  return (
    <div className="notificationDropdown">
      <div className="notificationHeader">
        <strong>알림</strong>
        <button type="button" className="notificationClear" onClick={() => onClear && onClear()}>{'모두 읽음'}</button>
      </div>
      {!currentUser || items.length === 0 ? (
        <div className="notificationItem empty">
          <div className="notificationTitle">아무것도 없습니다</div>
        </div>
      ) : (
        items.map((item, index) => (
          <div key={item.id || index} className={`notificationItem ${index < 2 ? 'highlight' : ''}`}>
            <div className="notificationDot" />
            <div className="notificationContent">
              <div className="notificationTitle">{item.title}</div>
              <div className="notificationSubtitle">{item.subtitle || '내용'}</div>
              <div className="notificationTime">{item.timeLabel || formatTime(item.time)}</div>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
