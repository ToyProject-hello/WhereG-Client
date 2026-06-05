import { LuChevronRight, LuKeyRound, LuLogOut, LuTrash2, LuX } from 'react-icons/lu';

export default function ProfileMenu({ onSelect, onClose }) {
  return (
    <div className="modalOverlay accountOverlay" onClick={onClose}>
      <div className="accountModal" onClick={(e) => e.stopPropagation()}>
        <div className="modalHeader accountHeader">
          <h3>계정 관리</h3>
          <button className="modalClose" onClick={onClose} aria-label="닫기">
            <LuX size={24} />
          </button>
        </div>

        <button type="button" className="profileMenuItem" onClick={() => onSelect('password')}>
          <LuKeyRound className="profileMenuIcon" size={24} />
          <span>비밀번호 변경</span>
          <LuChevronRight className="profileMenuArrow" size={24} />
        </button>
        <button type="button" className="profileMenuItem" onClick={() => onSelect('logout')}>
          <LuLogOut className="profileMenuIcon" size={24} />
          <span>로그아웃</span>
          <LuChevronRight className="profileMenuArrow" size={24} />
        </button>
        <div className="profileMenuDivider" />
        <button type="button" className="profileMenuItem warn" onClick={() => onSelect('withdraw')}>
          <LuTrash2 className="profileMenuIcon" size={24} />
          <span>회원탈퇴</span>
          <LuChevronRight className="profileMenuArrow" size={24} />
        </button>
      </div>
    </div>
  );
}
