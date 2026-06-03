export default function ProfileMenu({ onSelect }) {
  return (
    <div className="profileMenu">
      <button type="button" className="profileMenuItem" onClick={() => onSelect('password')}>
        비밀번호 변경
      </button>
      <button type="button" className="profileMenuItem" onClick={() => onSelect('logout')}>
        로그아웃
      </button>
      <button type="button" className="profileMenuItem warn" onClick={() => onSelect('withdraw')}>
        회원탈퇴
      </button>
    </div>
  );
}
