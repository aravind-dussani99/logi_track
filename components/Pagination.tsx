
import React from 'react';

interface PaginationProps {
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
}

const Pagination: React.FC<PaginationProps> = ({ currentPage, totalPages, onPageChange }) => {
    if (totalPages <= 1) return null;

    const pageNumbers = [];
    for (let i = 1; i <= totalPages; i++) {
        pageNumbers.push(i);
    }
    
    const renderPageNumbers = () => {
        if (totalPages <= 7) {
            return pageNumbers.map(number => (
                 <button key={number} onClick={() => onPageChange(number)} className={`px-4 py-2 mx-1 rounded-md text-sm ${currentPage === number ? 'bg-primary text-white' : 'bg-white dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600'}`}>
                    {number}
                </button>
            ));
        }

        const pages = [];
        // Always show first page
        pages.push(1);

        if (currentPage > 4) {
            pages.push('...');
        }

        // Show pages around current page
        for (let i = Math.max(2, currentPage - 2); i <= Math.min(totalPages - 1, currentPage + 2); i++) {
             pages.push(i);
        }
        
        if (currentPage < totalPages - 3) {
            pages.push('...');
        }

        // Always show last page
        pages.push(totalPages);

        return pages.map((page, index) => 
            typeof page === 'number' ? (
                 <button key={index} onClick={() => onPageChange(page)} className={`px-4 py-2 mx-1 rounded-md text-sm ${currentPage === page ? 'bg-primary text-white' : 'bg-white dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600'}`}>
                    {page}
                </button>
            ) : (
                <span key={index} className="px-4 py-2 mx-1 text-sm">...</span>
            )
        );

    };


    return (
        <div className="flex justify-center items-center mt-6">
            <button onClick={() => onPageChange(currentPage - 1)} disabled={currentPage === 1} className="px-4 py-2 mx-1 rounded-md text-sm bg-white dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed">
                Previous
            </button>
            {renderPageNumbers()}
            <button onClick={() => onPageChange(currentPage + 1)} disabled={currentPage === totalPages} className="px-4 py-2 mx-1 rounded-md text-sm bg-white dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed">
                Next
            </button>
        </div>
    );
};

export default Pagination;
