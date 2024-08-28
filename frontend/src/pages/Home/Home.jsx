import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import './home.css'

export default function Home() {
    const navigate = useNavigate()
    useEffect(() => {
        const token = localStorage.getItem('token')
        if (!token) {
            navigate('/login')
        }
    })
    return <div id="home-page">
        <button id='nav-login'>Login</button>
        <section id="hero-section" className='flex-center'>
            <div className='container'>
                <div className="blob1" />
                <div className="blob2" />
                <div className="blob3" />
                <div className="wrapper bgrd-blur">
                    <div>
                        <h1>Welcome to NIT Jalandhar Library</h1>
                        <h3>Your gateway to academic excellence. Discover a diverse collection of resources, connect with expert staff, and find the perfect space for your studies. We're here to support your learning journey every step of the way.</h3>
                        <button>Login</button>
                    </div>

                    <span id="hero-blob" className='flex-center'> 
                        <img src="hero-icon.png" alt="" />
                    </span>
                </div>
            </div>
        </section>
        <section>
            {/* about library - features */}
        </section>
        <section>
            {/* about staff */}
        </section>
        <section>
            {/* footer and contact us */}
        </section>
    </div>
}