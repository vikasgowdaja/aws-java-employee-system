import './App.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import {BrowserRouter as Router, Routes, Route, Navigate} from 'react-router-dom';
import Navbar from './layout/navbar';
import Home from './page/Home';
import AddEmployee from './function/addEmployee';
import EditEmployee from './function/EditEmployee';
import ViewEmployee from './function/ViewEmployee';
import Login from './page/Login';
import Register from './page/Register';
import {AuthProvider, useAuth} from './context/AuthContext';

function ProtectedRoute({ children }) {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) {
    return <Navigate to='/login' replace />;
  }
  return children;
}

function App() {
  return (
    <AuthProvider>
      <div className='App gradient-background'>
        <Router>
          <Navbar />
          <main className='container py-5'>
            <Routes>
              <Route
                exact
                path='/'
                element={
                  <ProtectedRoute>
                    <Home />
                  </ProtectedRoute>
                }
              />
              <Route
                exact
                path='/addEmployee'
                element={
                  <ProtectedRoute>
                    <AddEmployee />
                  </ProtectedRoute>
                }
              />
              <Route
                exact
                path='/editEmployee/:id'
                element={
                  <ProtectedRoute>
                    <EditEmployee />
                  </ProtectedRoute>
                }
              />
              <Route
                exact
                path='/viewEmployee/:id'
                element={
                  <ProtectedRoute>
                    <ViewEmployee />
                  </ProtectedRoute>
                }
              />
              <Route exact path='/login' element={<Login />} />
              <Route exact path='/register' element={<Register />} />
              <Route path='*' element={<Navigate to='/' replace />} />
            </Routes>
          </main>
        </Router>
      </div>
    </AuthProvider>
  );
}

export default App;
