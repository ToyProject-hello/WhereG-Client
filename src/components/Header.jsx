import { FaRegBell } from 'react-icons/fa6';
import { FaUserCircle } from 'react-icons/fa';
import { HiMapPin } from 'react-icons/hi2';
import { LuChevronDown } from 'react-icons/lu';

export default function Header({ activePage, onNavigate, onBellClick, onProfileClick, currentUser, unreadCount = 0 }) {
  const navItems = [
    { id: 'home', label: '홈' },
    { id: 'report', label: '분실물 신고' },
    { id: 'claim', label: '분실물 제보' },
    { id: 'notice', label: '공지' }
  ];

  return (
    <header className="header">
      <div className="headerLeft">
        <div className="logo" onClick={() => onNavigate('home')}>
          <HiMapPin className="logoIcon" />
          <span className="logoText">어딨G</span>
        </div>
        <nav className="nav">
          {navItems.map((item) => (
            <span
              key={item.id}
              className={`navItem ${activePage === item.id ? 'active' : ''}`}
              onClick={() => onNavigate(item.id)}
            >
              {item.label}
            </span>
          ))}
        </nav>
      </div>
      <div className="headerRight">
        <button className="iconBtn" onClick={onBellClick} aria-label="알림">
          <FaRegBell size={22} />
          {unreadCount > 0 && <span className="bellDot" />}
        </button>
        <div className="profile" onClick={onProfileClick}>
          <FaUserCircle size={24} />
          <span className="profileName">{currentUser || '로그인'}</span>
          <LuChevronDown className="arrowDown" />
        </div>
      </div>
    </header>
  );
}
