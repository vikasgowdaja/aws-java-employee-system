import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Navbar() {
    const { isAuthenticated, logout } = useAuth();
    const navigate = useNavigate();

    const onLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <nav className="navbar navbar-expand-lg navbar-dark header-navbar">
            <div className="container">
                <Link to="/" className="navbar-brand font-weight-bold">Employee Manager</Link>
                <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNavAltMarkup" aria-controls="navbarNavAltMarkup" aria-expanded="false" aria-label="Toggle navigation">
                    <span className="navbar-toggler-icon"></span>
                </button>
                <div className="collapse navbar-collapse" id="navbarNavAltMarkup">
                    <div className="navbar-nav ms-auto align-items-center">
                        {isAuthenticated ? (
                            <>
                                <Link to="/" className="nav-link">Dashboard</Link>
                                <button className="btn btn-danger btn-sm ms-2" onClick={onLogout}>
                                    Logout
                                </button>
                            </>
                        ) : (
                            <>
                                <Link to="/login" className="btn btn-light btn-sm ms-2">Login</Link>
                                <Link to="/register" className="btn btn-success btn-sm ms-2">Register</Link>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </nav>
    )
}
