import { useState } from 'react';
import { LuSearch } from 'react-icons/lu';
import { filterBySearch } from '../utils/search';

export default function LostReport({ onCardClick, reports = [] }) {
  const fallback = Array.from({ length: 8 }, (_, index) => ({
    id: `report-${index}`,
    title: `제목 ${index + 1}`,
    author: `작성자 ${index + 1}`,
    date: `2026-06-${(index % 30) + 1}`,
    status: '찾는중'
  }));

  const data = (reports && reports.length) ? reports : fallback;

  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState('');
  const [searchKeyword, setSearchKeyword] = useState('');
  const itemsPerPage = 12;
  const filteredData = filterBySearch(data, searchKeyword);
  const totalPages = Math.max(1, Math.ceil(filteredData.length / itemsPerPage));
  const currentPage = Math.min(page, totalPages);

  const start = (currentPage - 1) * itemsPerPage;
  const visible = filteredData.slice(start, start + itemsPerPage);

  const handleSearchSubmit = (event) => {
    event.preventDefault();
    setSearchKeyword(searchInput.trim());
    setPage(1);
  };

  return (
    <div className="pageContent listingPage">
      <form className="searchSection listingSearch" onSubmit={handleSearchSubmit}>
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

      {filteredData.length === 0 ? (
        <p className="emptySearchMessage">검색 결과가 없습니다</p>
      ) : (
        <>
          <div className="cardGrid grid4">
            {visible.map((item) => (
              <div key={item.id} className="card" onClick={() => onCardClick('reportDetail', item)}>
                <div
                  className="cardImagePlaceholder"
                  style={item.image ? { backgroundImage: `url(${item.image})` } : {}}
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

          <div className="pagination">
            <button className="pageBtn" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1}>{'<'}</button>
            {Array.from({ length: totalPages }, (_, i) => (
              <button
                key={i}
                className={`pageNumber ${currentPage === i + 1 ? 'active' : ''}`}
                onClick={() => setPage(i + 1)}
              >
                {i + 1}
              </button>
            ))}
            <button className="pageBtn" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>{'>'}</button>
          </div>
        </>
      )}
    </div>
  );
}
