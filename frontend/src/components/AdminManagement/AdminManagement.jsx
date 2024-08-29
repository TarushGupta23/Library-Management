import axios from 'axios';
import CryptoJS from 'crypto-js';
import { serverUrl } from '../../App';
import './adminManagement.css'
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function AdminManagement({admin, img}) {
    const [adminList, setAdminList] = useState([])
    const navigate = useNavigate()

    const createAdmin = async () => {
        const token = localStorage.getItem('token')

        const id = document.getElementById('create-admin-id').value;
        const password = document.getElementById('create-admin-password').value;
        const hashedPassword = CryptoJS.SHA256(password).toString(CryptoJS.enc.Hex);

        const responce = await axios.post(`${serverUrl}/add-admin`, {
            id, password: hashedPassword
        }, {
            headers: {
                'Content-Type': 'application/json',
                'x-access-token': token
            }
        })

        if (responce.data.error) {
            alert(responce.data.error)
        } else {
            alert('Admin created successfully')
        }
        getAdminList()
    }

    const removeAdmin = async (adminId) => {
        const token = localStorage.getItem('token')

        await axios.post(`${serverUrl}/remove-admin`, {
            id: adminId
        }, {
            headers: {
                'Content-Type': 'application/json',
                'x-access-token': token
            }
        })

        getAdminList()
    }
    
    const getAdminList = async () => {
        const token = localStorage.getItem('token')
        const responce = await axios.get(`${serverUrl}/admin-list`, {
            headers: {
                'Content-Type': 'application/json',
                'x-access-token': token
            }
        })
        setAdminList(responce.data.adminList)
    }

    const logOut = () => {
        localStorage.removeItem('token')
        navigate('/login')
    }

    const changePassword = async () => {
        if (!admin.email) {
            alert('Admin email not found')
        } else {
            const otp = Math.floor(Math.random() * 999999 + 100000)
            const responce = await axios.get(`${serverUrl}/change-password`, {
                headers: {
                    'Content-Type': 'application/json',
                    'x-access-token': admin.email
                }, params: {
                    email: admin.email,
                    otp: otp
                }
            })
            console.log(responce)
        }
    }

    useEffect(() => {

        getAdminList();
    }, [])

    return <section id="admin-management">
        <div className="admin-info">
            <div className="blob1" />
            <div className="blob2" />

            <div className="wrapper bgrd-blur">
                <img src={img} alt="admin profile pic" className={img === 'icons/user.png' ? "logo-gradient" : ""} />
                <div className="content">
                    <p>Logged in as</p>
                    <h2 className="admin-name">{admin.firstname} {admin.surname}</h2>
                    <span className="admin-id">Id: {admin.cardnumber}</span>
                    <span className="admin-contact">Contact: {admin.phone}</span>
                    <span className="admin-email">Email: {admin.email}</span>
                    <div className="btn-container">
                        <button type='button' onClick={changePassword}><div><span>Change Password</span> </div></button>
                        <button type='button' onClick={logOut}><div><span>Log Out</span> </div></button>
                    </div>
                </div>
            </div>
        </div>

        <div className="create-admin">
            <div className="blob1" />
            <div className="blob2" />
            <div className="wrapper bgrd-blur">
                <form action="" className="input-container">
                    <h2>Add Admin</h2>
                    <input type="text" placeholder='userId' id='create-admin-id' />
                    <input type="text" placeholder='password' id='create-admin-password' />
                    <button type='button' onClick={() => createAdmin()}>Add Admin</button>
                </form>
            </div>
        </div>

        <div className="admin-list">
            <div className="blob1" />
            <div className="blob2" />
            <div className="blob3" />
            <div className='wrapper bgrd-blur'>
                <h2>All Admins</h2>
                <ul>
                    {
                        adminList.map(admin => (<>
                            <h3 key={'name'+admin.adminid}>{admin.firstname} {admin.surname}</h3>
                            <span  key={'id'+admin.adminid}>{admin.adminid}</span>
                            <button type='button' onClick={() => removeAdmin(admin.adminid)}  key={'button'+admin.adminid}>
                                <img src="icons/delete.png" alt="" />
                            </button>
                        </>))
                    }
                </ul>
            </div>
        </div>
    </section>
}