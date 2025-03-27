import React, { useState } from 'react';
import { MDBBtn, MDBContainer, MDBRow, MDBCol, MDBInput } from 'mdb-react-ui-kit';
import { login } from '../../services/api';
import { NavLink, useNavigate } from 'react-router-dom';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await login(email, password);
      localStorage.setItem('token', response.data.token);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Erreur lors de la connexion');
    }
  };

  return (
    <div className="min-h-screen">
      <MDBContainer className="my-5 gradient-form">
        <MDBRow>
          <MDBCol col="6" className="mb-5">
            <div className="d-flex flex-column ms-5">
              <div className="text-center">
                <img
                  src="/assets/images/logo.png"
                  style={{ width: '185px' }}
                  alt="logo"
                />
                <h4 className="mt-1 mb-5 pb-1">MonBlog</h4>
              </div>
              <p>Veuillez vous connecter</p>
              {error && <p className="text-danger mb-4">{error}</p>}
              <MDBInput
                wrapperClass="mb-4"
                label="Email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <MDBInput
                wrapperClass="mb-4"
                label="Mot de passe"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <MDBBtn className="mb-4 w-100 gradient-custom-2" onClick={handleSubmit}>
                Se connecter
              </MDBBtn>
              <div className="text-center">
                <p>
                  Pas de compte ?{' '}
                  <NavLink to="/register">S’inscrire</NavLink>
                </p>
              </div>
            </div>
          </MDBCol>
          <MDBCol col="6" className="mb-5">
            <div className="d-flex flex-column justify-content-center gradient-custom-2 h-100 mb-4">
              <div className="text-white px-3 py-4 p-md-5 mx-md-4">
                <h4 className="mb-4">Plus qu’un simple blog</h4>
                <p className="small mb-0">
                  Partagez vos idées et connectez-vous avec vos amis.
                </p>
              </div>
            </div>
          </MDBCol>
        </MDBRow>
      </MDBContainer>
    </div>
  );
}