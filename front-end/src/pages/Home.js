import React, { useEffect, useState } from 'react'

function Home(){
    const [loggedInUser,setLoggedInUser]=useState('');

    useEffect(()=>{
        setLoggedInUser(localStorage.getItem('loggedInUser'))
    })

    const handleLogout=(e)=>{
        localStorage.removeItem('token');
        localStorage.removeItem('loggedInUser')
        setTimeout(()=>{}
        )
    }
    return (
        <div>
            <h1>{loggedInUser}</h1>
            <button onClick={handleLogout}> Logout</button>
            </div>
    )
}

export default Home