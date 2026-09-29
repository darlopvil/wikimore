// Client-side sorting for MediaWiki's "sortable" tables.
// MediaWiki does this with jquery-tablesorter, which we don't ship, so
// without this the tables render as plain ones. No dependencies.
(function () {
    "use strict";

    function cellText(row, index) {
        var cell = row.children[index];
        return cell ? cell.textContent.trim() : "";
    }

    // Accepts "54 943", "54.943", "1,5", "12%", "-3"; \u00a0 is the
    // non-breaking space MediaWiki uses as a thousands separator
    function asNumber(text) {
        var cleaned = text
            .replace(/[\s\u00a0\u202f]/g, "")
            .replace(/[%\u2009]/g, "")
            .replace(/\.(?=\d{3}\b)/g, "")
            .replace(",", ".");
        if (!/^[-+]?\d*\.?\d+$/.test(cleaned)) {
            return null;
        }
        return parseFloat(cleaned);
    }

    function comparator(index, descending) {
        return function (a, b) {
            var left = cellText(a, index);
            var right = cellText(b, index);
            var leftNumber = asNumber(left);
            var rightNumber = asNumber(right);
            var result;

            if (leftNumber !== null && rightNumber !== null) {
                result = leftNumber - rightNumber;
            } else {
                result = left.localeCompare(right, undefined, { numeric: true });
            }

            return descending ? -result : result;
        };
    }

    function sortableRows(body) {
        // Rows made only of <th> are headers or totals: leave them put
        return Array.prototype.filter.call(body.rows, function (row) {
            return Array.prototype.some.call(row.cells, function (cell) {
                return cell.tagName === "TD";
            });
        });
    }

    function initSortable(table) {
        var headerRow = table.tHead
            ? table.tHead.rows[table.tHead.rows.length - 1]
            : table.rows[0];
        var body = table.tBodies[0];

        if (!headerRow || !body || sortableRows(body).length < 2) {
            return;
        }

        Array.prototype.forEach.call(headerRow.cells, function (header, index) {
            if (header.tagName !== "TH" || header.classList.contains("unsortable")) {
                return;
            }

            header.classList.add("wm-sortable-header");
            header.setAttribute("tabindex", "0");
            header.setAttribute("role", "columnheader button");
            header.setAttribute("aria-sort", "none");

            function sort() {
                var descending = header.getAttribute("aria-sort") === "ascending";
                var rows = sortableRows(body);
                var anchor = rows[rows.length - 1].nextSibling;

                rows.sort(comparator(index, descending));
                rows.forEach(function (row) {
                    body.insertBefore(row, anchor);
                });

                Array.prototype.forEach.call(headerRow.cells, function (other) {
                    if (other.hasAttribute("aria-sort")) {
                        other.setAttribute("aria-sort", "none");
                    }
                });
                header.setAttribute(
                    "aria-sort",
                    descending ? "descending" : "ascending"
                );
            }

            header.addEventListener("click", sort);
            header.addEventListener("keydown", function (event) {
                if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    sort();
                }
            });
        });
    }

    document.addEventListener("DOMContentLoaded", function () {
        document.querySelectorAll("table.sortable").forEach(initSortable);
    });
})();