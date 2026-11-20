import {
    Search, ChevronLeft, ChevronRight, Inbox,
    X, ArrowUpDown, ArrowUp, ArrowDown
} from "lucide-react";
import { useEffect, useState, useMemo } from "react";

// Safely flatten nested values for accurate search
const extractSearchableText = (val) => {
    if (val === null || val === undefined) return "";
    if (typeof val === "object") {
        if (val instanceof Date) return val.toISOString();
        return Object.values(val).map(extractSearchableText).join(" ");
    }
    return String(val);
};

export default function DataTable({
    title,
    columns = [],
    data = [],
    searchQuery,
    setSearchQuery,
    actions,
    loading = false,
    rowsPerPage = 10,
    searchPlaceholder = "Search records..."
}) {
    const [internalSearch, setInternalSearch] = useState("");
    const [page, setPage] = useState(1);
    const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });

    // Support both controlled and uncontrolled search
    const activeSearch = searchQuery !== undefined ? searchQuery : internalSearch;
    const handleSearchChange = (val) => {
        if (setSearchQuery) {
            setSearchQuery(val);
        } else {
            setInternalSearch(val);
        }
    };

    // Reset to page 1 whenever search, data, or sort changes
    useEffect(() => {
        setPage(1);
    }, [activeSearch, data, sortConfig.key, sortConfig.direction]);

    // Filter rows safely
    const filteredData = useMemo(() => {
        const list = data || [];
        const q = (activeSearch || "").trim().toLowerCase();
        if (!q) return list;

        return list.filter((item) =>
            Object.values(item).some((val) =>
                extractSearchableText(val).toLowerCase().includes(q)
            )
        );
    }, [data, activeSearch]);

    // Sort filtered rows
    const sortedData = useMemo(() => {
        if (!sortConfig.key) return filteredData;

        const col = columns.find((c) => c.key === sortConfig.key);
        const dir = sortConfig.direction === "asc" ? 1 : -1;

        return [...filteredData].sort((a, b) => {
            const valA = col?.sortValue ? col.sortValue(a) : a?.[sortConfig.key];
            const valB = col?.sortValue ? col.sortValue(b) : b?.[sortConfig.key];

            if (valA === null || valA === undefined) return 1;
            if (valB === null || valB === undefined) return -1;

            if (typeof valA === "number" && typeof valB === "number") {
                return (valA - valB) * dir;
            }

            return String(valA).localeCompare(String(valB), undefined, {
                numeric: true,
                sensitivity: "base"
            }) * dir;
        });
    }, [filteredData, sortConfig, columns]);

    const totalItems = sortedData.length;
    const totalPages = Math.max(1, Math.ceil(totalItems / rowsPerPage));
    const safePage = Math.min(page, totalPages);
    const start = (safePage - 1) * rowsPerPage;
    const end = Math.min(start + rowsPerPage, totalItems);
    const paginatedData = sortedData.slice(start, end);

    const toggleSort = (col) => {
        if (col.sortable === false) return;
        setSortConfig((prev) => {
            if (prev.key !== col.key) return { key: col.key, direction: "asc" };
            if (prev.direction === "asc") return { key: col.key, direction: "desc" };
            return { key: null, direction: "asc" };
        });
    };

    const totalColumns = columns.length + (actions ? 1 : 0);

    return (
        <div className="data-table-container">
            {/* Header & Search */}
            <div className="table-header">
                <div className="table-title-group">
                    <h2>{title}</h2>
                    <span className="table-count-badge">
                        {activeSearch?.trim()
                            ? `${totalItems} of ${(data || []).length}`
                            : `${totalItems} ${totalItems === 1 ? "record" : "records"}`}
                    </span>
                </div>

                <div className="search-box">
                    <Search size={16} className="search-icon" />
                    <input
                        type="text"
                        placeholder={searchPlaceholder}
                        value={activeSearch || ""}
                        onChange={(e) => handleSearchChange(e.target.value)}
                        aria-label={`Search ${title || "records"}`}
                    />
                    {activeSearch && (
                        <button
                            type="button"
                            className="search-clear-btn"
                            onClick={() => handleSearchChange("")}
                            aria-label="Clear search"
                            title="Clear search"
                        >
                            <X size={14} />
                        </button>
                    )}
                </div>
            </div>

            {/* Table Body */}
            <div className="table-wrap">
                <table>
                    <thead>
                        <tr>
                            {columns.map((col) => {
                                const isSortable = col.sortable !== false;
                                const isSorted = sortConfig.key === col.key;
                                return (
                                    <th key={col.key}>
                                        {isSortable ? (
                                            <button
                                                type="button"
                                                className={`th-sort-btn ${isSorted ? "sorted" : ""}`}
                                                onClick={() => toggleSort(col)}
                                            >
                                                <span>{col.label}</span>
                                                {isSorted ? (
                                                    sortConfig.direction === "asc" ? (
                                                        <ArrowUp size={13} />
                                                    ) : (
                                                        <ArrowDown size={13} />
                                                    )
                                                ) : (
                                                    <ArrowUpDown size={13} className="sort-idle-icon" />
                                                )}
                                            </button>
                                        ) : (
                                            col.label
                                        )}
                                    </th>
                                );
                            })}
                            {actions && <th style={{ textAlign: "right" }}>Actions</th>}
                        </tr>
                    </thead>

                    <tbody>
                        {loading ? (
                            Array.from({ length: 5 }).map((_, idx) => (
                                <tr key={`skeleton-${idx}`} className="table-skeleton-row">
                                    {Array.from({ length: totalColumns }).map((__, cIdx) => (
                                        <td key={cIdx}>
                                            <div className="skeleton-line" />
                                        </td>
                                    ))}
                                </tr>
                            ))
                        ) : paginatedData.length === 0 ? (
                            <tr>
                                <td colSpan={totalColumns} className="table-empty-cell">
                                    <div className="table-empty-state">
                                        <div className="table-empty-icon">
                                            <Inbox size={34} />
                                        </div>
                                        <h3>No records found</h3>
                                        <p>
                                            {activeSearch
                                                ? `No matches for "${activeSearch}". Try another keyword.`
                                                : "There are no entries to display yet."}
                                        </p>
                                        {activeSearch && (
                                            <button
                                                type="button"
                                                className="btn-sm"
                                                onClick={() => handleSearchChange("")}
                                            >
                                                Clear filter
                                            </button>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            paginatedData.map((item, idx) => (
                                <tr key={item._id || item.id || idx}>
                                    {columns.map((col) => (
                                        <td key={col.key} data-label={col.label}>
                                            {col.render ? col.render(item) : item[col.key]}
                                        </td>
                                    ))}
                                    {actions && (
                                        <td data-label="Actions" className="table-actions-cell">
                                            <div className="table-actions-group">
                                                {actions(item)}
                                            </div>
                                        </td>
                                    )}
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination Footer */}
            {!loading && totalItems > 0 && (
                <div className="pagination">
                    <span className="pagination-summary">
                        Showing <strong>{start + 1}–{end}</strong> of <strong>{totalItems}</strong>
                    </span>

                    {totalPages > 1 && (
                        <div className="pagination-controls">
                            <button
                                type="button"
                                disabled={safePage === 1}
                                onClick={() => setPage((p) => Math.max(1, p - 1))}
                            >
                                <ChevronLeft size={15} /> Previous
                            </button>

                            <span className="pagination-page">
                                Page <strong>{safePage}</strong> of {totalPages}
                            </span>

                            <button
                                type="button"
                                disabled={safePage === totalPages}
                                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                            >
                                Next <ChevronRight size={15} />
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}