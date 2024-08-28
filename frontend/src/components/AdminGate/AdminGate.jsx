import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import BarChart from '../BarChart/BarChart'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom';
import PieChart from '../PieChart/PieChart'
import './adminGate.css'
import { serverUrl } from '../../App';
import axios from 'axios';
import Table from '../Table/Table';

const calenderMaskUrl = './../../../icons/calender.png';
const profileMaskUrl = './../../../icons/users.png';
const searchMaskUrl = './../../../icons/search-results.png';
const nullData = {
    history_count: [], visitor_count: 0, staff_count: 0, male_count: 0, female_count: 0
}

const initialData = {
    labels: [],
    datasets: [{
        label: null,
        data: [],
        backgroundColor: [],
        borderColor: [],
        borderWidth: 1
    }]
}

export default function AdminGate() {
    const navigate = useNavigate()
    const [barData, setBarData] = useState(initialData)
    const [pieData, setPieData] = useState(initialData)
    const [tableData, setTableData] = useState({
        title: [],
        body: []
    })

    const submitForm = async (taskType) => {
        const dateFrom = document.getElementById('gate-dateFrom').value
        const dateTo = document.getElementById('gate-dateTo').value
        const timeFrom = document.getElementById('gate-timeFrom').value
        const timeTo = document.getElementById('gate-timeTo').value

        const name = document.getElementById('gate-name').value
        const id = document.getElementById('gate-id').value
        const category = document.getElementById('gate-category').value

        const type = document.getElementById('gate-type-visitor').checked? 'visitor' : 'user'
        const length = document.getElementById('gate-data-short').checked? 'short' : 'long'

        const formData = {
            dateFrom, dateTo, timeFrom, timeTo,
            name, id, category, type, length
        }

        const token = localStorage.getItem('token')
        const responce = await axios.get(`${serverUrl}/admin-entry-history`, {
            headers: {
                'Content-Type': 'application/json',
                'x-access-token': token
            }, 
            params: formData
        })
        
        handleFormSubmit(responce.data, taskType)
    }

    const handleFormSubmit = (data, taskType) => {
        if (data.message === 'unauthorised') {
            navigate('/');
        } else if (data.message === 'failed') {
            navigate('/login');
        } else if (data.error) {
            alert('error occured')
        } else {
            if (taskType === 'search') {
                setTableData({
                    title: data.title,
                    body: data.body
                })
            } else if (taskType === 'excel') {
                const mergedata = [tableData.title, ...tableData.body];
                const worksheet = XLSX.utils.aoa_to_sheet(mergedata);
                const workbook = XLSX.utils.book_new();
                XLSX.utils.book_append_sheet(workbook, worksheet, "Table Data");
                XLSX.writeFile(workbook, "TableData.xlsx");
            } else if (taskType === 'pdf') {
                const doc = new jsPDF();
                doc.autoTable({
                    head: [tableData.title],
                    body: tableData.body,
                });
                doc.save('TableData.pdf');
            }
        }
    }

    const clearDateForm = () => {
        document.getElementById('gate-dateFrom').value = ''
        document.getElementById('gate-dateTo').value = ''
        document.getElementById('gate-timeFrom').value = ''
        document.getElementById('gate-timeTo').value = ''
    }
    
    const clearUserForm = () => {
        document.getElementById('gate-type-user').checked = true
        document.getElementById('gate-name').value = ''
        document.getElementById('gate-id').value = ''
        document.getElementById('gate-category').value = ''
    }

    useEffect(() => {
        const token = localStorage.getItem('token')

        const setStats = async () => {
            const response = await axios.get(`${serverUrl}/admin-gate-stats`, {
                headers: {
                    'Content-Type': 'application/json',
                    'x-access-token': token
                }
            });
            const {history_count, visitor_count, staff_count, male_count, female_count} = (response.data.history_count)? response.data:nullData;

            const newPieData = {
                labels: ['Visitors', 'Staff', 'Males', 'Females'],
                datasets: [{
                    label: "Today's entries",
                    data: [ visitor_count, staff_count, male_count, female_count ],
                    backgroundColor: [ '#a294e230', '#ffffff30', '#6aa3ff30', '#c2e9fb30' ],
                    borderColor: [ '#a294e2', '#ffffff', '#6aa3ff', '#c2e9fb' ],
                    borderWidth: 1,
                    dataVisibility: [true, true, true, true]
                }]
            }
            const newBarData = {
                labels: history_count.map(entry => entry.day),
                datasets: [{
                    label: 'total entries',
                    data: history_count.map(entry => entry.total_entries),
                    backgroundColor: ['#6aa3ff30', '#c2e9fb30'],
                    borderColor: ['#6aa3ff', '#c2e9fb'],
                    borderWidth: 1
                }]
            };
            setPieData(newPieData)
            setBarData(newBarData)
        }

        setStats();

        const initialiseResponce = async () => {
            const formData = {
                dateFrom: new Date().toISOString().split('T')[0], dateTo: '', timeFrom: '', timeTo: '',
                name: '', id: '', category: '', type: 'user', length: 'long'
            }
            const responce = await axios.get(`${serverUrl}/admin-entry-history`, {
                headers: {
                    'Content-Type': 'application/json',
                    'x-access-token': token
                }, 
                params: formData
            })
            
            handleFormSubmit(responce.data, 'search')
        }

        clearUserForm()
        clearDateForm()
        initialiseResponce()

        document.getElementById('gate-type-user').checked = true
        document.getElementById('gate-data-long').checked = true
    }, [])

    return <section id="gate-management">
        <div id="gate-stats">
            <div className="blob1" />
            <div className="blob2" />
            <div className="blob3" />
            <div className="bgrd-blur wrapper">
                <h2>
                    Gate Entry Stats 
                    <button onClick={() => navigate('/gate')}> <div><span>Display Entry Page</span> </div> </button>
                </h2>
                <div className="charts">
                    <div id="bar-chart" className='flex-center'>
                        <BarChart data={barData} />
                        <div className='bar-navigation'>
                            Entries - Last 6 Days
                        </div>
                    </div>
                    <div id="pie-chart" className='flex-center'>
                        <PieChart data={pieData} />
                        <span>Today's Entries</span>
                    </div>
                </div>
            </div>
        </div>

        <ul id='gate-filters'>
            <li> 
                <div className="blob1" />
                <div className="blob2" />

                <div className="bgrd-blur filter-wrapper">
                    <div className="heading-wrapper">
                        <div className='filter-icon' style={{ '--mask-image': `url('${calenderMaskUrl}')` }} />
                        <p>
                            <h3> Filter By Date </h3>
                            Allows filtering results based on a specific date and time range.
                        </p>
                    </div>
                    <div className="input-container">
                        <input type="text" id="gate-dateFrom" name='dateFrom' placeholder='date from (YYYY-MM-DD)'/>
                        <input type="text" id="gate-dateTo" name='dateTo' placeholder='date to (YYYY-MM-DD)'/>
                        <input type="text" id="gate-timeFrom" name='timeFrom' placeholder='time from (HH:MM:SS)'/>
                        <input type="text" id="gate-timeTo" name='timeTo' placeholder='time to (HH:MM:SS)'/>
                    </div>
                    <div className="button-container">
                        <button onClick={clearDateForm}>Clear</button>
                    </div>
                </div>
            </li>

            <li> 
                <div className="blob1" />
                <div className="blob2" />

                <div className="bgrd-blur filter-wrapper">
                    <div className="heading-wrapper">
                        <div className='filter-icon' style={{ '--mask-image': `url(${profileMaskUrl})` }} />
                        <p>
                            <h3> Filter By User</h3>
                            Enables filtering results based on user-specific criteria such as UID, department, and category.
                        </p>
                    </div>
                    <div className="input-container">
                        <input type="text" id='gate-name' name='name' placeholder='Name'/>
                        <input type="text" id='gate-id' name='id' placeholder='UID'/>
                        <input type="text" id='gate-category' name='category' placeholder='Category'/>
                        <div className="check-container">
                            <span>
                                <input type="radio" value='student' name='type' id='gate-type-user' /> Student/Staff
                            </span>
                            <span>
                                <input type="radio" value='visitor' name='type' id='gate-type-visitor' /> Visitor
                            </span>
                            
                        </div>

                    </div>
                    <div className="button-container">
                        <button onClick={clearUserForm}>Clear</button>
                    </div>
                </div>
            </li>

            <li> 
                <div className="blob1" />
                <div className="blob2" />

                <div className="bgrd-blur filter-wrapper">
                    <div className="heading-wrapper">
                        <div className='filter-icon' style={{ '--mask-image': `url(${searchMaskUrl})` }} />
                        <p>
                            <h3> Get Results </h3>
                            Provides options to view results in either a short or detailed format and export them as Excel or PDF.
                        </p>
                    </div>
                    <div className="input-container">
                        <div className="check-container">
                            <span>
                                <input type="radio" value='short' name='displayInfo' id='gate-data-short'/> Short
                            </span>
                            <span>
                                <input type="radio" value='detailed' name='displayInfo' id='gate-data-long'/> Detailed
                            </span>
                        </div>
                    </div>
                    <div className="button-container">
                        <button type='button' onClick={() => submitForm('search')}>Search</button>
                        <button type='button' onClick={() => submitForm('excel')}>Get Excel</button>
                        <button type='button' onClick={() => submitForm('pdf')}>Get PDF</button>
                        <button type='button' onClick={() => {clearDateForm(); clearUserForm()}}>Clear All</button>
                    </div>
                </div>
            </li>
        </ul>

        <div className="gate-results">
            <div className="blob1" />
            <div className="blob2" />
            <div className="blob3" />
            <div className="wrapper bgrd-blur">
                <h2>Results</h2>
                {/* <p>showing results for : xyz</p> */}
                <div>
                    <Table titles={tableData.title} data={tableData.body} />
                </div>
            </div>
        </div>
    </section>
}