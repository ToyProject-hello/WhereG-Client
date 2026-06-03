import { useState } from 'react';

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
  const itemsPerPage = 12;
  const totalPages = Math.ceil(data.length / itemsPerPage);

  const start = (page - 1) * itemsPerPage;
  const visible = data.slice(start, start + itemsPerPage);

  return (
    <div className="pageContent">
      <div className="pageHeader">
        <h2 className="pageTitle">분실물 신고</h2>
      </div>

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
        <button className="pageBtn" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>{'<'}</button>
        {Array.from({ length: totalPages }, (_, i) => (
          <button
            key={i}
            className={`pageNumber ${page === i + 1 ? 'active' : ''}`}
            onClick={() => setPage(i + 1)}
          >
            {i + 1}
          </button>
        ))}
        <button className="pageBtn" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}>{'>'}</button>
      </div>
    </div>
  );
}
