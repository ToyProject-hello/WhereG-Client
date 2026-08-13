import { useState } from 'react';
import { LuSearch } from 'react-icons/lu';
import { filterBySearch } from '../utils/search';

export default function Home({ onCardClick, reports = [], claims = [], loading = false, isLoggedIn = true }) {
  const reportData = reports;
  const claimData = claims;
  const recentReports = reportData.slice(0, 4);
  const recentClaims = claimData.slice(0, 4);
  const [searchInput, setSearchInput] = useState('');
  const [searchKeyword, setSearchKeyword] = useState('');
  const isSearching = searchKeyword.length > 0;
  const searchResults = isSearching
    ? [
      ...filterBySearch(reportData, searchKeyword).map((item) => ({ ...item, resultPage: 'reportDetail', resultType: 'report' })),
      ...filterBySearch(claimData, searchKeyword).map((item) => ({ ...item, resultPage: 'claimDetail', resultType: 'claim' })),
    ]
    : [];

  const handleSearchSubmit = (event) => {
    event.preventDefault();
    setSearchKeyword(searchInput.trim());
  };

  return (
    <div className="pageContent">
      <form className="searchSection homeSearch" onSubmit={handleSearchSubmit}>
        <div className="searchWrapper">
          <LuSearch className="searchIcon" size={20} />
          <input
            className="searchInput"
            placeholder="검색어를 입력해주세요."
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
          />
        </div>
        <button type="submit" className="searchBtn">검색</button>
      </form>

      {isSearching ? (
        <section className="section">
          <div className="sectionHeader">
            <h2 className="sectionTitle">검색 결과</h2>
          </div>
          {searchResults.length === 0 ? (
            <p className="emptySearchMessage">검색 결과가 없습니다</p>
          ) : (
            <div className="cardGrid">
              {searchResults.map((item) => (
                <div key={`${item.resultType}-${item.id}`} className="card" onClick={() => onCardClick(item.resultPage, item)}>
                  <div
                    className="cardImagePlaceholder"
                    style={item.image ? { backgroundImage: `url(${item.image})`, backgroundSize: 'cover', backgroundPosition: 'center' } : {}}
                    data-has-image={!!item.image}
                  />
                  <div className="cardContent">
                    <h3 className="cardTitle">{item.title}</h3>
                    <p className="cardMeta">{item.author}</p>
                    <p className="cardMeta">{item.date}</p>
                    <span className={`badge ${item.status === '완료' ? 'badgeCompleted' : item.resultType === 'claim' ? 'badgeKeeping' : 'badgeSearching'}`}>{item.status}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      ) : loading ? (
        <p className="emptySearchMessage">불러오는 중...</p>
      ) : (
        <>
          <section className="section">
            <div className="sectionHeader">
              <h2 className="sectionTitle">최근 분실물 신고</h2>
              <button className="moreBtn" onClick={() => onCardClick('report')}>
                더보기 &gt;
              </button>
            </div>
            {recentReports.length === 0 ? (
              <p className="emptySearchMessage">등록된 분실물 신고가 없습니다</p>
            ) : (
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
            )}
          </section>

          <section className="section">
            <div className="sectionHeader">
              <h2 className="sectionTitle">최근 분실물 제보</h2>
              <button className="moreBtn" onClick={() => onCardClick('claim')}>
                더보기 &gt;
              </button>
            </div>
            {recentClaims.length === 0 ? (
              <p className="emptySearchMessage">등록된 분실물 제보가 없습니다</p>
            ) : (
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
            )}
          </section>
        </>
      )}
    </div>
  );
}
