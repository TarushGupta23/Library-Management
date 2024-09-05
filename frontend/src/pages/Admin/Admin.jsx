import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import './admin.css'
import axios from 'axios'
import { serverUrl } from '../../App'
import AdminGate from '../../components/AdminGate/AdminGate'
import AdminManagement from '../../components/AdminManagement/AdminManagement'

export default function Admin() {
    const navigate = useNavigate()
    const [page, setPage] = useState('admin')
    const [adminImg, setAdminImg] = useState('icons/user.png')
    const [admin, setAdmin] = useState({
        cardnumber: '',
        firstname: '', surname: '',
        phone: ''
    })

    const logoutUser = () => {
        localStorage.removeItem('token')
        navigate('/login');
    }

    useEffect(() => {
        const getMyInfo = async () => {
            const token = localStorage.getItem('token');
            const response = await axios.get(`${serverUrl}/my-info`, {
                headers: {
                    'Content-Type': 'application/json',
                    'x-access-token': token
                }
            })
            if (response.data.message === 'authorised') {
                setAdmin(response.data.userData)
                let img = response.data.userData.profileImage
                img = (typeof img === 'string')? `data:image/png;base64,${img}` : './icons/user.png'
                setAdminImg(img)
            }
        }

        const checkToken = async () => {
            const token = localStorage.getItem('token');
            if (!token) {
                navigate('/login');
            } else {
                try {
                    const response = await axios.get(`${serverUrl}/varify`, {
                        headers: {
                            'Content-Type': 'application/json',
                            'x-access-token': token
                        }
                    });

                    if (response.data.message === 'user') {
                        navigate('/');
                    } else if (response.data.message === 'failed') {
                        navigate('/login');
                    } else {
                        getMyInfo()
                    }
                } catch (error) {
                    console.error('Error verifying token:', error);
                    navigate('/login');
                }
            }
        };

        checkToken();
    }, [navigate]);

    return <div id='admin-container'>
        <nav>
            <header>
                <div>
                    <h1>NIT Jalandhar Library</h1>
                    <h2>Admin Dashboard</h2>
                </div>
            </header>
            <section id="admin-profile">
                <img src={adminImg} alt="admin profile pic" className={adminImg === 'icons/user.png' ? "logo-gradient" : ""} />
                <div className='text'>
                    <h1>{admin.firstname} {admin.surname}</h1>
                    <span className="btn-container">
                        <button onClick={logoutUser}> <div><span>Log Out</span> </div> </button>
                    </span>
                </div>

            </section>

            <section id='admin-navigation'>
                <ul>
                    <li className={page==='admin'? 'active' : ''} onClick={() => setPage('admin')}><img src="icons/admin.png" alt="" />Admin Management</li>
                    <li className={page==='gate'? 'active' : ''} onClick={() => setPage('gate')}><img src="icons/gate.png" alt="" />Gate Management</li>
                </ul>
            </section>
        </nav>
        
        <main>
            {page==='gate' && <AdminGate />}
            {page==='admin' && <AdminManagement admin={admin} img={adminImg} />}
        </main>
    </div>
}

/** todo
 * icons on admin-navigation
*/ 