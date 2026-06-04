import { LuCamera, LuClipboardList, LuPlus } from 'react-icons/lu';

export default function FabMenu({ isOpen, onToggle, onAction }) {
  return (
    <div className="fabContainer">
      <div style={{ position: 'relative' }}>
        {isOpen && (
          <div className="fabMenu">
            <button className="fabMenuItem" onClick={() => onAction('reportForm')}>
              <LuClipboardList className="fabMenuIcon reportColor" />
              <span className="fabMenuText">분실물 신고</span>
            </button>
            <div className="fabDivider" />
            <button className="fabMenuItem" onClick={() => onAction('claimForm')}>
              <LuCamera className="fabMenuIcon tipColor" />
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
