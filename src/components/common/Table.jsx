const Table = ({ 
  columns, 
  data, 
  isLoading = false,
  emptyMessage = 'No data available',
  onRowClick,
}) => {
  if (isLoading) {
    return (
      <div className="min-w-full overflow-hidden rounded-lg shadow">
        <div className="flex justify-center items-center p-8">
          <div className="animate-pulse flex flex-col w-full">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 w-full mb-4 rounded"></div>
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-12 bg-gray-100 dark:bg-gray-800 w-full mb-2 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!data?.length) {
    return (
      <div className="min-w-full overflow-hidden rounded-lg shadow">
        <div className="bg-white dark:bg-dark-lighter p-8 text-center text-gray-500 dark:text-gray-400">
          {emptyMessage}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full overflow-x-auto rounded-lg shadow">
      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        <thead className="bg-gray-50 dark:bg-gray-800">
          <tr>
            {columns.map((column, index) => (
              <th
                key={index}
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                style={column.width ? { width: column.width } : {}}
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white dark:bg-dark-lighter divide-y divide-gray-200 dark:divide-gray-700">
          {data.map((row, rowIndex) => (
            <tr 
              key={rowIndex}
              onClick={() => onRowClick && onRowClick(row)}
              className={onRowClick ? 'cursor-pointer hover:bg-gray-50 dark:hover:bg-dark-light' : ''}
            >
              {columns.map((column, colIndex) => (
                <td key={colIndex} className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900 dark:text-gray-100">
                    {column.accessor && column.render 
                      ? column.render(row[column.accessor], row) 
                      : column.accessor 
                        ? row[column.accessor]
                        : column.render(row)}
                  </div>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Table;