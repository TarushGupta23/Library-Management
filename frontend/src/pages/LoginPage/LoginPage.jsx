import CryptoJS from 'crypto-js';
import axios from 'axios'
import './loginPage.css'
import { serverUrl } from '../../App';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { instituteFullName, instituteLogo, instituteName } from '../../Config';


export default function LoginPage() {
    const navigate = useNavigate()
    
    const loginUser = async (event) => {
        event.preventDefault();

        const username = document.getElementById('loginId').value;
        const password = document.getElementById('loginPassword').value;

        let hashedPassword = CryptoJS.SHA256(password).toString(CryptoJS.enc.Hex);
        if (username.toLowerCase() === 'library') {
            hashedPassword = password;
        }

        const response = await axios.post(`${serverUrl}/login`, {
            username, password: hashedPassword
        }, {
            headers: { 'Content-Type': 'application/json' }
        });

        switch (response.data.message) {
            case 'success':
                localStorage.setItem('token', response.data.token)
                if (response.data.role === 'admin') {
                    navigate('/admin')
                } else {
                    navigate('/')
                }
                break;
            case 'failed':
                alert('Invalid username or password');
                break;
            case 'error':
                alert('Error occurred while logging in');
                break;
        }
    }

    useEffect(() => {
        const checkToken = async () => {
            const token = localStorage.getItem('token');
            if (token) {
                try {
                    const response = await axios.get(`${serverUrl}/varify`, {
                        headers: {
                            'Content-Type': 'application/json',
                            'x-access-token': token
                        }
                    });

                    if (response.data.message === 'admin') {
                        navigate('/admin');
                    } else if (response.data.message === 'user') {
                        navigate('/');
                    }
                } catch (error) {
                    console.error('Error verifying token:', error);
                }
            }
        }

        checkToken();
    }, [navigate]);

    return <section id='login-page' className='flex-center'>
        <div id='login-container'>
            <div id='login-explain'>
                <img src={instituteLogo} alt="" />
                <h3>{instituteName} <br /> Library Login Portal</h3>
                The {instituteFullName} library is a key resource center, offering an extensive collection of materials and a quiet environment for study, supporting the academic and research needs of students and faculty across various disciplines. It plays a crucial role in fostering learning and intellectual growth within the campus community.
            </div>

            <form onSubmit={(event) => loginUser(event)}>
                <span>
                    <h1>Login</h1>
                    <h3>Welcome! Please login to your account</h3>
                </span>

                <span>
                    <label htmlFor=''>College Id</label>
                    <input type="text" id='loginId' required />
                </span>

                <span>
                    <label htmlFor="">Password</label>
                    <input type="password" id='loginPassword' required />
                </span>

                <span id='forgot-pwd'>Forgot Password?</span>

                <span>
                    <button>Login</button>
                </span>

            </form>
        </div>
    </section>
}