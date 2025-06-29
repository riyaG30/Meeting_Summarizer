import React, { useState, useEffect } from 'react';
import {
    DatePicker,
    DatePickerInput,
    TextInput,
    Button,
    InlineLoading,
    Modal,
    DataTable,
    TableContainer,
    Table,
    TableHead,
    TableRow,
    TableHeader,
    TableBody,
    TableCell
} from '@carbon/react';
import { Download } from '@carbon/icons-react';
import { Renew } from '@carbon/icons-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import './History.scss';
import { useContext } from 'react';
import { AuthContext } from "../../context/AuthContext";

const History = () => {
    const [selectedDate, setSelectedDate] = useState('');
    const [personName, setPersonName] = useState('');
    const [standupDates, setStandupDates] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [selectedStandupDate, setSelectedStandupDate] = useState('');
    const [standupDetails, setStandupDetails] = useState([]);
    const [modalLoading, setModalLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    //const { token, setToken } = useContext(AuthContext);
    useEffect(() => {
        fetchStandupDates();
    }, []);

    const fetchStandupDates = async () => {
        try {
            setRefreshing(true);
            setLoading(true);
            const token = localStorage.getItem("token");
            const response = await fetch('http://localhost:4000/api/summaries/', {
                headers: {
                    Authorization: `Bearer ${token}`
                }

            });
            const data = await response.json();

            const today = new Date();
            const tenDaysAgo = new Date();
            tenDaysAgo.setDate(today.getDate() - 11);

            const filteredAndSorted = data
                .filter(entry => {
                    const entryDate = new Date(entry.date);
                    return entryDate >= tenDaysAgo && entryDate <= today;
                })
                .sort((a, b) => new Date(b.date) - new Date(a.date)) // Descending order
                .map(entry => ({
                    _id: entry.date,
                    date: new Date(entry.date).toLocaleDateString('en-GB'),
                    participants: entry.items.map(i => i.user)
                }));

            setStandupDates(filteredAndSorted);
        } catch (error) {
            console.error('Error fetching standup dates:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const handleRefresh = () => {
        setLoading(true);
        fetchStandupDates();
    };

    const fetchStandupDetails = async (dateStr) => {
        try {
            setModalLoading(true);
            const token = localStorage.getItem("token");
            const response = await fetch('http://localhost:4000/api/summaries/', {
                headers: {
                    Authorization: `Bearer ${token}`
                }

            });
            const data = await response.json();
            const match = data.find(d => new Date(d.date).toLocaleDateString('en-GB') === dateStr);
            const mapped = (match?.items || []).map((item, index) => ({
                id: index + 1,
                srNo: index + 1,
                name: item.user,
                completed: item.completed_tasks,
                toDo: item.todo_tasks,
                blockers: item.blockers
            }));
            setStandupDetails(mapped);
        } catch (error) {
            console.error('Error fetching standup details:', error);
        } finally {
            setModalLoading(false);
        }
    };

    const fetchFilteredStandup = async () => {
        if (!selectedDate || !personName) return;
        try {
            setModalLoading(true);
            const token = localStorage.getItem("token");
            const formattedDate = selectedDate.split('/').reverse().join('-'); // dd/mm/yyyy to yyyy-mm-dd
            const response = await fetch(
                `http://localhost:4000/api/summaries/search?date=${formattedDate}&user=${encodeURIComponent(personName)}`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            if (response.status === 204 || response.status === 404) {
                // No content or not found
                setStandupDetails([]);
            } else if (response.ok) {
                const data = await response.json();

                const mapped = [
                    {
                        id: 1,
                        srNo: 1,
                        name: data.user,
                        completed: data.completed_tasks,
                        toDo: data.todo_tasks,
                        blockers: data.blockers
                    }
                ];

                setStandupDetails(mapped);
            } else {
                console.error('Unexpected response:', response.status);
                setStandupDetails([]);
            }

            setSelectedStandupDate(selectedDate);
            setModalOpen(true);
        } catch (err) {
            console.error('Error fetching filtered summary:', err);
        } finally {
            setModalLoading(false);
        }
    };


    const handleSearch = () => {
    if (!selectedDate) return; // require date at least

    if (selectedDate && !personName) {
        // Only date selected -> show full standup summary for that date
        fetchFullStandupByDate(selectedDate);
    } else if (selectedDate && personName) {
        // Both date and personName present -> filtered search
        fetchFilteredStandup();
    }
};

    const handleDownload = (date) => {
        if (!standupDetails || standupDetails.length === 0) {
            console.warn('No data to download');
            return;
        }

        const doc = new jsPDF();
        doc.setFontSize(18);
        doc.text(`Standup Summary - ${date}`, 14, 22);

        const tableColumn = ['S.No.', 'Person', 'Completed', 'To-do', 'Blockers'];
        const tableRows = standupDetails.map(detail => [
            detail.srNo,
            detail.name,
            detail.completed,
            detail.toDo,
            detail.blockers
        ]);

        autoTable(doc, {
            startY: 30,
            head: [tableColumn],
            body: tableRows,
            styles: { fontSize: 10 },
            headStyles: { fillColor: [0, 0, 0] }
        });

        doc.save(`standup-summary-${date.replace(/\//g, '-')}.pdf`);
    };

    const handleStandupClick = (date) => {
        setSelectedStandupDate(date);
        setModalOpen(true);
        fetchStandupDetails(date);
    };
    const fetchFullStandupByDate = async (dateStr) => {
    try {
        setModalLoading(true);
        const token = localStorage.getItem("token");
        const response = await fetch('http://localhost:4000/api/summaries/', {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });
        const data = await response.json();

        const match = data.find(d => new Date(d.date).toLocaleDateString('en-GB') === dateStr);
        if (!match) {
            setStandupDetails([]);
            return;
        }

        const mapped = match.items.map((item, index) => ({
            id: index + 1,
            srNo: index + 1,
            name: item.user,
            completed: item.completed_tasks,
            toDo: item.todo_tasks,
            blockers: item.blockers
        }));

        setStandupDetails(mapped);
        setSelectedStandupDate(dateStr);
        setModalOpen(true);
    } catch (error) {
        console.error('Error fetching full standup by date:', error);
        setStandupDetails([]);
    } finally {
        setModalLoading(false);
    }
};


    const handleModalClose = () => {
        setModalOpen(false);
        setSelectedStandupDate('');
        setStandupDetails([]);
    };

    const headers = [
        { key: 'srNo', header: 'S.No.' },
        { key: 'name', header: 'Person' },
        { key: 'completed', header: 'Completed' },
        { key: 'toDo', header: 'To-do' },
        { key: 'blockers', header: 'Blockers' }
    ];

    return (
        <div className="previous-standups">
            <div className="previous-standups__header">
                <h2 className="previous-standups__title">Previous Stand ups</h2>
                <button
                    className={`refresh-button ${refreshing ? 'refreshing' : ''}`}
                    onClick={handleRefresh}
                    disabled={refreshing}
                    aria-label="Refresh documents"
                >
                    <Renew />
                </button>
            </div>

            <div className="previous-standups__form">
                <div className='previous-standups__form-header'>
                    <h2>Search for any date summary (or for a particular person)</h2>
                </div>
                <div className="previous-standups__form-row">

                    <div className="previous-standups__date-field">
                        <DatePicker
                            dateFormat="d/m/Y"
                            datePickerType="single"
                            onChange={(dates) => setSelectedDate(dates[0]?.toLocaleDateString('en-GB'))}
                        >
                            <DatePickerInput
                                id="date-picker"
                                labelText={
                                    <>
                                        Select date<span style={{ color: 'red' }}>*</span>
                                    </>
                                }
                                placeholder="dd/mm/yyyy"
                                required
                            />
                        </DatePicker>
                    </div>

                    <div className="previous-standups__name-field">
                        <TextInput
                            id="person-name"
                            labelText="Person name"
                            placeholder="Enter person name"
                            value={personName}
                            onChange={(e) => setPersonName(e.target.value)}
                        />
                    </div>

                    <div className="previous-standups__submit-button">
                        <Button
                            kind="primary"
                            disabled={!selectedDate }
                            onClick={handleSearch}
                        >
                            Search
                        </Button>
                    </div>
                </div>
            </div>

            <div className="previous-standups__list">
                <div className="previous-standups__list-header">
                    <h2>Recent Summaries</h2>
                </div>

                {standupDates.length === 0 && !loading ? (
                    <div className="previous-standups__no-data">
                        No recent summaries for the team
                    </div>
                ) : loading ? (
                    <div className="previous-standups__loading">
                        <InlineLoading description="Loading stand-ups..." />
                    </div>
                ) : (
                    standupDates.map((standup) => (
                        <div
                            key={standup._id}
                            className="previous-standups__item"
                        >
                            <div className="previous-standups__item-content">
                                <span
                                    className="previous-standups__item-date"
                                    onClick={() => handleStandupClick(standup.date)}
                                >
                                    {standup.date}
                                </span>
                                <button
                                    className="previous-standups__download-btn"
                                    onClick={() => {
                                        setSelectedStandupDate(standup.date);
                                        fetchStandupDetails(standup.date).then(() =>
                                            handleDownload(standup.date)
                                        );
                                    }}
                                >
                                    <Download size={20} />
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>

            <Modal
                open={modalOpen}
                onRequestClose={handleModalClose}
                modalHeading={selectedStandupDate}
                primaryButtonText="Download PDF"
                secondaryButtonText="Cancel"
                onRequestSubmit={() => handleDownload(selectedStandupDate)}
                size="md"
                className="standup-modal"
            >
                <div className="standup-modal__content">
                    {modalLoading ? (
                        <div className="standup-modal__loading">
                            <InlineLoading description="Loading standup details..." />
                        </div>
                    ) : (
                        <div className="standup-modal__table-container">
                            <DataTable rows={standupDetails} headers={headers}>
                                {({ rows, headers, getTableProps, getHeaderProps, getRowProps }) => (
                                    <Table>
                                        <TableHead>
                                            <TableRow>
                                                {headers.map((header) => (
                                                    <TableHeader {...getHeaderProps({ header })} key={header.key}>
                                                        {header.header}
                                                    </TableHeader>
                                                ))}
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {rows.length === 0 ? (
                                                <TableRow>
                                                    <TableCell colSpan={headers.length} className='empty-message'>
                                                        No summary available for the selected date
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
                                )}
                            </DataTable>
                        </div>
                    )}
                </div>
            </Modal>
        </div>
    );
};

export default History;
