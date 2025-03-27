import React, { useState } from 'react';
import {
  MDBContainer,
  MDBNavbar,
  MDBNavbarBrand,
  MDBNavbarToggler,
  MDBIcon,
  MDBNavbarNav,
  MDBNavbarItem,
  MDBNavbarLink,
  MDBCollapse,
  MDBBtn,
} from 'mdb-react-ui-kit';
import { NavLink, useNavigate } from 'react-router-dom';
import { logout } from '../../services/api';

export default function Navbar() {
  const [openBasic, setOpenBasic] = useState(false);
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      localStorage.removeItem('token');
      navigate('/login');
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <MDBNavbar expand="lg" light bgColor="light">
      <MDBContainer fluid>
        <MDBNavbarBrand tag={NavLink} to="/">
          <img
            src="/assets/images/logo.png" // Remplace par ton logo
            alt="MonBlog"
            style={{ height: '40px' }}
          />
        </MDBNavbarBrand>

        <MDBNavbarToggler
          aria-controls="navbarSupportedContent"
          aria-expanded="false"
          aria-label="Toggle navigation"
          onClick={() => setOpenBasic(!openBasic)}
        >
          <MDBIcon icon="bars" fas />
        </MDBNavbarToggler>

        <MDBCollapse navbar open={openBasic}>
          <MDBNavbarNav className="mr-auto mb-2 mb-lg-0">
            <MDBNavbarItem>
              <MDBNavbarLink tag={NavLink} to="/" activeClassName="active">
                Accueil
              </MDBNavbarLink>
            </MDBNavbarItem>
            <MDBNavbarItem>
              <MDBNavbarLink tag={NavLink} to="/dashboard" activeClassName="active">
                Dashboard
              </MDBNavbarLink>
            </MDBNavbarItem>
            <MDBNavbarItem>
              <MDBNavbarLink tag={NavLink} to="/login" activeClassName="active">
                Connexion
              </MDBNavbarLink>
            </MDBNavbarItem>
            <MDBNavbarItem>
              <MDBNavbarLink tag={NavLink} to="/register" activeClassName="active">
                Inscription
              </MDBNavbarLink>
            </MDBNavbarItem>
            {localStorage.getItem('token') && (
              <MDBNavbarItem>
                <MDBBtn color="danger" onClick={handleLogout}>
                  Déconnexion
                </MDBBtn>
              </MDBNavbarItem>
            )}
          </MDBNavbarNav>
        </MDBCollapse>
      </MDBContainer>
    </MDBNavbar>
  );
}