import CryptoJS from 'crypto-js';
import axios from 'axios'
import './loginPage.css'
import { serverUrl } from '../../App';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';


export default function LoginPage() {
    const navigate = useNavigate()
    
    const loginUser = async (event) => {
        event.preventDefault();

        const username = document.getElementById('loginId').value;
        const password = document.getElementById('loginPassword').value;

        const hashedPassword = CryptoJS.SHA256(password).toString(CryptoJS.enc.Hex);

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
                <img src="nitjLogo.png" alt="" />
                <h3>Dr BR Ambdekar NIT Jalandhar <br /> Library Login Portal</h3>
                Dr. B.R. Ambedkar National Institute of Technology Jalandhar is a premier technical institution in India, dedicated to fostering innovation and excellence. Our library, a vital part of the campus, offers a vast collection of resources and a quiet space for study, supporting the academic journey of our students and faculty.
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

/** todo : 
 * login fail or error
 * forgot password
 * add contact or mail of admin
*/