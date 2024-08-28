import { useEffect, useState } from 'react';
import './gate.css'
import { inOutDisplayTime, serverUrl } from '../../App';
import axios from 'axios'
import { useNavigate } from 'react-router-dom';
import Table from '../../components/Table/Table';
import BarcodeReader from 'react-barcode-reader';

function formatTime() {
    const date = new Date()
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();

    let hours = date.getHours();
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'pm' : 'am';
    hours = hours % 12;
    hours = hours ? hours : 12;
    const formattedHours = String(hours).padStart(2, '0');
    const formattedSec = String(date.getSeconds()).padStart(2, '0');

    return `${day}/${month}/${year} ${formattedHours}:${minutes}:${formattedSec} ${ampm}`;
}

const initialData = {
    student: {
        name: "?", id: '?', category: '?', inOut: '?', image: 'nitjLogo.png'
    }, visitor: {
        name: '?', contact: '?', email: '?', inOut: '?'
    }
}

export default function Gate() {
    const [display, setDisplay] = useState('std-entry');
    const [tableDisplay, setTableDisplay] = useState('users')
    const [tableData, setTableData] = useState([])
    const [visitorTableData, setVisitorTableData] = useState([])
    const [studentData, setStudentData] = useState(initialData)
    const [statsData, setStatsData] = useState({
        males: 0, females: 0, staff: 0, visitor: 0, total: 0
    })

    const navigate = useNavigate();
    
    const changeDisplay = (event, display) => {
        event.preventDefault()
        setDisplay(display)
    }

    const submitEntry = async (event) => {
        event.preventDefault()
    
        const uId = document.getElementById('uId-gateEntry').value;
        const response = await axios.post(`${serverUrl}/submit-gate-entry`, {
            type: 'user', userId: uId
        }, {
            headers: { 'Content-Type': 'application/json' }
        });
    
        handleEntryResponce(response.data)
    }

    const submitVisitorEntry = async (event) => {
        event.preventDefault()
        
        const contact = document.getElementById('contact-gateEntry').value;
        const mail = document.getElementById('mail-gateEntry').value;
        const name = document.getElementById('name-gateEntry').value;
    
        const response = await axios.post(`${serverUrl}/submit-gate-entry`, {
            type: 'visitor', contact, mail, name
        }, {
            headers: { 'Content-Type': 'application/json' }
        });

        handleVisitorEntryResponce(response.data)
    }

    const handleVisitorEntryResponce = (data) => {
        const inOut = (data.message === 'entered')? "Entered" : "Exited";
        const newData = {
            name: data.name,
            contact: data.contact,
            email: data.mail,
            inOut: inOut,
        }
        setStudentData({...initialData, visitor: newData})
        setDisplay('visitor-profile')
        getData();

        setTimeout(() => {
            setDisplay('std-entry')
        }, inOutDisplayTime *1000)
    }

    const handleEntryResponce = (data) => {
        const inOut = (data.message === 'entered')? "Entered" : "Exited";
        const newData = {
            name: (data.firstname + ' ' + data.surname),
            id: data.cardnumber,
            category: data.categorycode,
            inOut: inOut,
            image: (typeof data.profileImage === 'string')? `data:image/png;base64,${data.profileImage}` : './icons/user.png'
        }
        setStudentData({...initialData, student: newData})
        setDisplay('std-profile')
        getData();

        setTimeout(() => {
            setDisplay('std-entry')
        }, inOutDisplayTime *1000)
    }

    const getData = async () => {
        const token = localStorage.getItem('token')
        if (!token) {
            navigate('/login')
        } else {
            try {
                const response = await axios.get(`${serverUrl}/gate-display-data`, {
                    headers: {
                        'Content-Type': 'application/json',
                        'x-access-token': token
                    }
                });
                if (response.data.message === 'unauthorised') {
                    navigate('/');
                } else if (response.data.message === 'failed') {
                    navigate('/login');
                } else if (response.data.error) {
                    alert('error occured')
                } else {
                    const usersArr = [];
                    const visitorsArr = [];
                    const newStats = {
                        males: 0, females: 0, staff: 0, total: 0, visitor: 0
                    }
                    response.data.gateData.forEach(obj => {
                        const name = obj.firstname + " " + obj.surname;
                        
                        if (!obj.outTime || obj.outTime == '') {
                            newStats.total++;
                            if (obj.categorycode === 'STAFF') {
                                newStats.staff++;
                            } else if (obj.sex === 'M') {
                                newStats.males++;
                            } else {
                                newStats.females++;
                            }
                        }
                        usersArr.push([
                            name, obj.cardnumber, obj.branchcode, obj.inTime, obj.outTime
                        ])
                    })

                    response.data.visitorData.forEach(obj => {
                        if (!obj.outTime || obj.outTime == '') {
                            newStats.visitor++;
                            newStats.total++;
                        }

                        visitorsArr.push([obj.name, obj.contact, obj.mail, obj.inTime, obj.outTime])
                    })
    
                    setStatsData(newStats)
                    setTableData(usersArr)
                    setVisitorTableData(visitorsArr)
                }
            } catch (error) {
                console.error('Error verifying token:', error);
                navigate('/login');
            }
        }
    }

    const handleScan = async (data) => {
        if (data) {
            const response = await axios.post(`${serverUrl}/submit-gate-entry`, {
                type: 'user', userId: data
            }, {
                headers: { 'Content-Type': 'application/json' }
            });
            handleEntryResponce(response.data)
        }
    };
    
    const handleError = (err) => {
        console.error(err);
        alert('failed to scan barcode')
    };
    
    useEffect(() => {
        document.getElementById('time-container').innerHTML = 'Time: ' + formatTime();
        const intervalId = setInterval(() => {
            document.querySelectorAll('#time-container').forEach((elem) => {
                elem.innerHTML = 'Time: ' + formatTime();
            })
        }, 1000)

        getData()

        return () => clearInterval(intervalId);
    }, [navigate])
    
    return <div id='gate-container'>
        <BarcodeReader
            onError={handleError}
            onScan={handleScan}
        />
        <section id='heading'>
            <div className="bgrd-img" />
            <div className='text'> 
                <h1>Dr BR Ambedkar NIT Jalandhar</h1>
                <h3>Library In/Out Management System</h3>
            </div>
        </section>

        <section id='student-entry'>
            <div className="blob1" />
            <div className="blob2" />
            <div className="blob3" />

            <div className="display-container bgrd-blur">

                <form id='student-entry' className={display==='std-entry'? 'active display-wrapper' : 'display-wrapper'}>
                    <img src="nitjLogo.png" alt="NIT Jalandhar Logo" className="logo" />
                    <div id="time-container"> Time: 22/3/2024 10:30 pm </div>

                    <span className="inp-container">
                        <input type="text" id='uId-gateEntry' placeholder='Enter Roll No.' required />
                    </span>
                    <p>Or Scan I-Card</p>
                    
                    <span className='btn-container'>
                        <button onClick={(event) => submitEntry(event)} type='submit'>Enter/Exit</button>
                        <button onClick={(event) => changeDisplay(event, 'visitor-entry')} type='button'>Visitor Entry</button>
                    </span>
                </form>

                <div className={display==='std-profile'? "active std-profile display-wrapper" : "std-profile display-wrapper"}>
                    <img src={studentData.student.image} alt="Student Profile" className={studentData.student.image === 'icons/user.png' ? "logo logo-gradient" : "logo"} />
                    <h3 className="std-name">{studentData.student.name}</h3>
                    <p className="std-id">Roll No: {studentData.student.id}</p>
                    <div id="time-container"> Time: 22/3/2024 10:30 pm </div>
                    <p className="std-category">Category: {studentData.student.category}</p>
                    
                    {/* <button type='button'>Full Profile</button> */}
                    
                    <div className='in-out-bar flex-center'> {studentData.student.inOut} 
                        <div id="progress-bar" className={display==='std-profile' ? 'active' : 'inactive'}/> 
                    </div>
                </div>

                <div className={display==='visitor-profile'? "active std-profile display-wrapper" : "std-profile display-wrapper"}>
                    <img src='icons/user.png' alt="Student Profile" className="logo logo-gradient" />
                    <h3 className="std-name">{studentData.visitor.name}</h3>
                    <p className="std-id">Contact: {studentData.visitor.contact}</p>
                    <p className="std-category">Mail: {studentData.visitor.email}</p>
                    <div id="time-container"> Time: 22/3/2024 10:30 pm </div>
                    
                    {/* <button type='button'>Full Profile</button> */}
                    
                    <div className='in-out-bar flex-center'> {studentData.visitor.inOut} 
                        <div id="progress-bar" className={display==='visitor-profile' ? 'active' : 'inactive'}/> 
                    </div>
                </div>
                
                <div className={display==='visitor-entry'? "active visitor-entry display-wrapper" : "visitor-entry display-wrapper"}>
                    <img src="nitjLogo.png" alt="NIT Jalandhar Logo" className="logo" />
                    <div id="time-container"> Time: 22/3/2024 10:30 pm </div>

                    <span className="inp-container">
                        <input type="text" id='contact-gateEntry' placeholder='Visitor Contact' required />
                        <input type="text" id='name-gateEntry' placeholder='Visitor Name'/>
                        <input type="text" id='mail-gateEntry' placeholder='Visitor Mail'/>
                    </span>
                    
                    <span className='btn-container'>
                        <button type='submit' onClick={(event) => submitVisitorEntry(event)}>Enter/Exit</button>
                        <button type='button' onClick={(event) => changeDisplay(event, 'std-entry')}>Student/Staff Entry</button>
                    </span>
                </div>

            </div>
        </section>
        
        <section id='student-list'>
            <div className="blob1" />
            <div className="blob2" />
            <div className="blob3" />
            <div id="table-container" className='bgrd-blur'>
                <form>
                    <button type='button' className={tableDisplay==='users' && 'selected'} onClick={() => setTableDisplay('users')}>Students/Staff</button> 
                    <button type='button' className={tableDisplay==='visitors' && 'selected'} onClick={() => setTableDisplay('visitors')}>Visitors</button>
                </form>
                <div>
                {
                    (tableDisplay === 'users') ? 
                    <Table titles={['Name', 'ID', 'Branch', 'In Time', 'Out Time']} data={tableData} /> 
                    : <Table titles={['Name', 'Contact', 'Mail', 'In Time', 'Out Time']} data={visitorTableData} /> 
                }
                </div>
            </div>
        </section>

        <section id="info">
            <div className="blob1" />
            <div className="blob2" />
            <div className="blob3" />
            <ul className='bgrd-blur'>
                <li>
                    <h4>Total</h4> <p>{statsData.total}</p>
                </li>
                <li>
                    <h4>Staff</h4> <p>{statsData.staff}</p>
                </li>
                <li>
                    <h4>Male</h4> <p>{statsData.males}</p>
                </li>
                <li>
                    <h4>Female</h4> <p>{statsData.females}</p>
                </li>
                <li>
                    <h4>Visitor</h4> <p>{statsData.visitor}</p>
                </li>
            </ul>
        </section>

    </div>
}