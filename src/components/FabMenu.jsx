import { LuPlus } from 'react-icons/lu';
import { FaClipboardList, FaCamera } from 'react-icons/fa';

export default function FabMenu({ isOpen, onToggle, onAction }) {
  return (
    <div className="fabContainer">
      <div style={{ position: 'relative' }}>
        {isOpen && (
          <div className="fabMenu">
            <button className="fabMenuItem" onClick={() => onAction('reportForm')}>
              <FaClipboardList className="fabMenuIcon reportColor" />
              <span className="fabMenuText">분실물 신고</span>
            </button>
            <div className="fabDivider" />
            <button className="fabMenuItem" onClick={() => onAction('claimForm')}>
              <FaCamera className="fabMenuIcon tipColor" />
              <span className="fabMenuText">분실물 제보</span>
            </button>
          </div>
        )}
        <button className="fabMainBtn" onClick={onToggle} aria-label="액션 버튼">
          <LuPlus size={32} />
        </button>
      </div>
    </div>
  );
}
