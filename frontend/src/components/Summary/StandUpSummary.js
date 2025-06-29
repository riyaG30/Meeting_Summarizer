
// import React, { useState, useEffect } from 'react';
// import {
//   DataTable,
//   Table,
//   TableHead,
//   TableRow,
//   TableHeader,
//   TableBody,
//   TableCell
// } from '@carbon/react';
// import './StandUpSummary.scss';
// import { useParsed } from '../../context/ParsedContext';
// import Loading from "../Loading/Loading";

// const headers = [
//   { key: 'id', header: 'Sr. No.' },
//   { key: 'name', header: 'Name' },
//   { key: 'completed', header: 'Completed Tasks' },
//   { key: 'todo', header: 'To-do Tasks' },
//   { key: 'blockers', header: 'Blockers' }
// ];

// const StandUpSummary = () => {

//   const [loading, setLoading] = useState(false);
//   const [summary, setSummary] = useState([]);
//   const { parsedData, isProcessing } = useParsed();


//   console.log('Initial parsedData from context:', parsedData);
//   console.log('Initial summary state:', summary);

//   useEffect(() => {
//     console.log('useEffect triggered due to parsedData change.');

//     if (parsedData && parsedData.items && parsedData.items.length > 0) {
//       console.log('Parsed data is available. Setting loading to true...');
//       setLoading(true);

//       setTimeout(() => {
//         const transformed = parsedData.items.map((item, index) => ({
//           id: `${index + 1}`,
//           name: item.user,
//           completed: item.completed_tasks,
//           todo: item.todo_tasks,
//           blockers: item.blockers
//         }));
//         console.log('✅ Transformed summary:', transformed);
//         setSummary(transformed);
//         setLoading(false);
        
//       }, 1000);
//     } else {
//       console.log('Parsed data is empty or not available. Setting summary to empty array.');
//       setSummary([]);
      
      
//     }
//   }, [parsedData]);

//   return (
//     <div className="standup-summary">
//       <div className="standup-summary__header">
//         <h2 className="standup-summary__title">StandUp Summary</h2>
//       </div>
//       <div className="table-scroll-container">
//         <DataTable rows={summary} headers={headers} isSortable={false}>
//           {({ rows, headers, getHeaderProps }) => {
//             console.log('Rendering DataTable with rows:', rows);

//             return (
//               <Table>
//                 <TableHead>
//                   <TableRow>
//                     {headers.map((header) => {
//                       const { key, ...rest } = getHeaderProps({ header });
//                       return (
//                         <TableHeader key={key} {...rest}>
//                           {header.header}
//                         </TableHeader>
//                       );
//                     })}
//                   </TableRow>
//                 </TableHead>
//                 <TableBody>
//                   {loading||isProcessing ? (
//                     <TableRow>
//                       <TableCell colSpan={headers.length} className="empty-message">
//                         <Loading text="Loading stand-up summary..." />
//                         </TableCell>
//                     </TableRow>
//                   ) : rows.length === 0 ? (
//                     <TableRow>
//                       <TableCell colSpan={headers.length} className="empty-message">
//                         No transcript uploaded yet
//                       </TableCell>
//                     </TableRow>
//                   ) : (
//                     rows.map((row) => (
//                       <TableRow key={row.id}>
//                         {row.cells.map((cell) => (
//                           <TableCell key={cell.id}>{cell.value}</TableCell>
//                         ))}
//                       </TableRow>
//                     ))
//                   )}
//                 </TableBody>
//               </Table>
//             );
//           }}
//         </DataTable>
//       </div>
//     </div>
//   );
// };

// export default StandUpSummary;




import React, { useState, useEffect } from 'react';
import {
  DataTable,
  Table,
  TableHead,
  TableRow,
  TableHeader,
  TableBody,
  TableCell
} from '@carbon/react';
import './StandUpSummary.scss';
import { useParsed } from '../../context/ParsedContext';
import Loading from "../Loading/Loading";
const headers = [
  { key: 'id', header: 'Sr. No.' },
  { key: 'name', header: 'Name' },
  { key: 'completed', header: 'Completed Tasks' },
  { key: 'todo', header: 'To-do Tasks' },
  { key: 'blockers', header: 'Blockers' }
];
const StandUpSummary = () => {
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState([]);
  const { parsedData, isProcessing } = useParsed();
  console.log('Initial parsedData from context:', parsedData);
  console.log('Initial summary state:', summary);
  useEffect(() => {
    console.log('useEffect triggered due to parsedData change.');
    if (parsedData && parsedData.items && parsedData.items.length > 0) {
      console.log('Parsed data is available. Setting loading to true...');
      setLoading(true);
      setTimeout(() => {
        const transformed = parsedData.items.map((item, index) => ({
          id: `${index + 1}`,
          name: item.user,
          completed: item.completed_tasks,
          todo: item.todo_tasks,
          blockers: item.blockers
        }));
        console.log(':white_check_mark: Transformed summary:', transformed);
        setSummary(transformed);
        setLoading(false);
      }, 1000);
    } else {
      console.log('Parsed data is empty or not available. Setting summary to empty array.');
      setSummary([]);
    }
  }, [parsedData]);
  return (
    <div className="standup-summary">
      <div className="standup-summary__header">
        <h2 className="standup-summary__title">StandUp Summary</h2>
      </div>
      <div className="table-scroll-container">
        <DataTable rows={summary} headers={headers} isSortable={false}>
          {({ rows, headers, getHeaderProps }) => {
            console.log('Rendering DataTable with rows:', rows);
            return (
              <Table>
                <TableHead>
                  <TableRow>
                    {headers.map((header) => {
                      const { key, ...rest } = getHeaderProps({ header });
                      return (
                        <TableHeader key={key} {...rest}>
                          {header.header}
                        </TableHeader>
                      );
                    })}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {loading||isProcessing ? (
                    <TableRow>
                      <TableCell colSpan={headers.length} className="empty-message">
                        <Loading text="Loading stand-up summary..." />
                        </TableCell>
                    </TableRow>
                  ) : rows.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={headers.length} className="empty-message">
                        No transcript uploaded yet
                      </TableCell>
                    </TableRow>
                  ) : (
                    rows.map((row) => (
                      <TableRow key={row.id}>
                        {row.cells.map((cell) => (
                          <TableCell key={cell.id}>{cell.value}</TableCell>
                        ))}
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            );
          }}
        </DataTable>
      </div>
    </div>
  );
};
export default StandUpSummary;









