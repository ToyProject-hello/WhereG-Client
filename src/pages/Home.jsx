import { LuSearch } from 'react-icons/lu';

const dummyReports = Array.from({ length: 4 }, (_, index) => ({
  id: `report-${index}`,
  title: '제목',
  author: '작성자',
  date: '날짜',
  status: '찾는중'
}));

const dummyClaims = Array.from({ length: 4 }, (_, index) => ({
  id: `claim-${index}`,
  title: '제목',
  author: '작성자',
  date: '날짜',
  status: '보관중'
}));

export default function Home({ onCardClick, reports = [], claims = [] }) {
  const recentReports = (reports && reports.length) ? reports.slice(0, 4) : dummyReports;
  const recentClaims = (claims && claims.length) ? claims.slice(0, 4) : dummyClaims;

  return (
    <div className="pageContent">
      <div className="searchSection homeSearch">
        <div className="searchWrapper">
          <LuSearch className="searchIcon" size={20} />
          <input className="searchInput" placeholder="검색어를 입력해주세요." />
        </div>
        <button className="searchBtn">검색</button>
      </div>

      <section className="section">
        <div className="sectionHeader">
          <h2 className="sectionTitle">최근 분실물 신고</h2>
          <button className="moreBtn" onClick={() => onCardClick('report')}>
            더보기 &gt;
          </button>
        </div>
        <div className="cardGrid">
          {recentReports.map((item) => (
            <div key={item.id} className="card" onClick={() => onCardClick('reportDetail', item)}>
              <div
                className="cardImagePlaceholder"
                style={item.image ? { backgroundImage: `url(${item.image})`, backgroundSize: 'cover', backgroundPosition: 'center' } : {}}
                data-has-image={!!item.image}
              />
              <div className="cardContent">
                <h3 className="cardTitle">{item.title}</h3>
                <p className="cardMeta">{item.author}</p>
                <p className="cardMeta">{item.date}</p>
                <span className={`badge ${item.status === '완료' ? 'badgeCompleted' : 'badgeSearching'}`}>{item.status}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="section">
        <div className="sectionHeader">
          <h2 className="sectionTitle">최근 분실물 제보</h2>
          <button className="moreBtn" onClick={() => onCardClick('claim')}>
            더보기 &gt;
          </button>
        </div>
        <div className="cardGrid">
          {recentClaims.map((item) => (
            <div key={item.id} className="card" onClick={() => onCardClick('claimDetail', item)}>
              <div
                className="cardImagePlaceholder"
                style={item.image ? { backgroundImage: `url(${item.image})`, backgroundSize: 'cover', backgroundPosition: 'center' } : {}}
                data-has-image={!!item.image}
              />
              <div className="cardContent">
                <h3 className="cardTitle">{item.title}</h3>
                <p className="cardMeta">{item.author}</p>
                <p className="cardMeta">{item.date}</p>
                <span className={`badge ${item.status === '완료' ? 'badgeCompleted' : 'badgeKeeping'}`}>{item.status}</span>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
