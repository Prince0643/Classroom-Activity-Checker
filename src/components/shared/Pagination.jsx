export default function Pagination({ currentPage, totalPages, onPageChange, totalItems }) {
  if (totalPages <= 1) return null;

  return (
    <div style={{ 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'space-between',
      padding: '16px 18px',
      borderTop: '1px solid rgba(15,23,42,.07)',
      background: '#fff'
    }}>
      <div style={{ fontSize: 13, color: '#5b6b85' }}>
        Showing {Math.min((currentPage - 1) * 10 + 1, totalItems)} - {Math.min(currentPage * 10, totalItems)} of {totalItems}
      </div>
      
      <div style={{ display: 'flex', gap: 8 }}>
        <button
          className="btn btn--light btn--sm"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          style={{ opacity: currentPage === 1 ? 0.5 : 1 }}
        >
          Previous
        </button>
        
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: 4,
          fontSize: 13,
          fontWeight: 600,
          padding: '0 12px'
        }}>
          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
            let pageNum;
            if (totalPages <= 5) {
              pageNum = i + 1;
            } else if (currentPage <= 3) {
              pageNum = i + 1;
            } else if (currentPage >= totalPages - 2) {
              pageNum = totalPages - 4 + i;
            } else {
              pageNum = currentPage - 2 + i;
            }
            
            return (
              <button
                key={pageNum}
                onClick={() => onPageChange(pageNum)}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  border: '1px solid ' + (pageNum === currentPage ? '#1d4ed8' : 'rgba(15,23,42,.12)'),
                  background: pageNum === currentPage ? '#1d4ed8' : '#fff',
                  color: pageNum === currentPage ? '#fff' : '#0f172a',
                  cursor: 'pointer',
                  fontSize: 13,
                  fontWeight: 600
                }}
              >
                {pageNum}
              </button>
            );
          })}
        </div>
        
        <button
          className="btn btn--light btn--sm"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          style={{ opacity: currentPage === totalPages ? 0.5 : 1 }}
        >
          Next
        </button>
      </div>
    </div>
  );
}
