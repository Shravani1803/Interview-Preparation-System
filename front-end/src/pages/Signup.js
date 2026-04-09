import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ToastContainer } from 'react-toastify';
import { handleError, handleSuccess } from '../utils';

function Signup() {
    
    const [signupInfo, setSignupInfo] = useState({
        name: '',
        email: '',
        password: ''
    });

    const navigate = useNavigate();

    const handleChange = (e) => {
        const { name, value } = e.target;

        setSignupInfo(prev => ({
            ...prev,
            [name]: value
        }));
    }

    const handleSignup = async (e) => {
        e.preventDefault();
        const { name, email, password } = signupInfo;

        if (!name || !email || !password) {
            return handleError('name, email and password are required')
        }

        try {
            const url = "http://localhost:8080/auth/signup";

            const response = await fetch(url, {
                method: "POST",
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(signupInfo)
            });

            const result = await response.json();
            const { success, message, error } = result;

            if (success) {
                handleSuccess(message);
                setTimeout(() => {
                    navigate('/login')
                }, 100);
            }
            else if (error) {
                const details = error?.details[0].message;
                handleError(details);
            } else {
                handleError(message);
            }

        } catch (err) {
            handleError(err);
        }
    }

    return (
        <div className="auth-wrapper">
            <div className="auth-container">

                <h1>Signup</h1>

                <form onSubmit={handleSignup}>

                    <div>
                        <label>Name</label>
                        <input
                            onChange={handleChange}
                            type='text'
                            name='name'
                            autoFocus
                            placeholder='Enter your Name'
                            value={signupInfo.name}
                        />
                    </div>

                    <div>
                        <label>Email</label>
                        <input
                            onChange={handleChange}
                            type='email'
                            name='email'
                            placeholder='Enter your email'
                            value={signupInfo.email}
                        />
                    </div>

                    <div>
                        <label>Password</label>
                        <input
                            onChange={handleChange}
                            type='password'
                            name='password'
                            placeholder='Enter your Password'
                            value={signupInfo.password}
                        />
                    </div>

                    <button type='submit'>Signup</button>

                    <span>
                        Already have an account ?
                        <Link to="/login"> Login</Link>
                    </span>

                </form>

                <ToastContainer />

            </div>
        </div>
    )
}

export default Signup;