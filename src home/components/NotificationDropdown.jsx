export default function NotificationDropdown({ currentUser, notifications = null, onClear, onOpen }) {
  const formatTime = (time) => {
    if (!time) return '';
    const date = new Date(time);
    if (Number.isNaN(date.getTime())) return time;
    const diff = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    if (diff < 60) return '방금 전';
    if (diff < 3600) return `${Math.floor(diff / 60)}분 전`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}시간 전`;
    if (diff < 2592000) return `${Math.floor(diff / 86400)}일 전`;
    return date.toLocaleDateString('ko-KR');
  };

  const userItems = notifications ? notifications.filter((n) => n.recipient === currentUser) : [];
  const items = userItems;

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
          <button
            key={item.id || index}
            type="button"
            className={`notificationItem ${!item.read ? 'highlight' : ''}`}
            onClick={() => onOpen && onOpen(item)}
          >
            {!item.read && <div className="notificationDot" />}
            <div className="notificationContent">
              <div className="notificationTitle">{item.title}</div>
              <div className="notificationSubtitle">{item.subtitle || '내용'}</div>
              <div className="notificationTime">{item.timeLabel || formatTime(item.time)}</div>
            </div>
          </button>
        ))
      )}
    </div>
  );
}
