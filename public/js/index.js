import '@babel/polyfill';
import { login, logout } from './login';
import { displayMap } from './mapbox';
import { updateUserData } from './updateProfile';
import { bookTour } from './stripe';

// DOM ELEMENTS
const mapBox = document.getElementById('map');
const loginForm = document.querySelector('.form--login');
const logOutBtn = document.querySelector('.nav__el--logout');
const userDataFrom = document.querySelector('.form-user-data');
const userPasswordFrom = document.querySelector('.form-user-password');
const bookTourBtn = document.getElementById('book-tour');

// DELEGATION
if (mapBox) {
    const locations = JSON.parse(mapBox.dataset.locations);
    displayMap(locations);
}

if (loginForm) {
    loginForm.addEventListener('submit', e => {
        e.preventDefault();
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        login(email, password);
    });
};

if (logOutBtn) {
    logOutBtn.addEventListener('click', logout);
};

if (userDataFrom) {
    userDataFrom.addEventListener('submit', e => {
        e.preventDefault();
        const form = new FormData();
        form.append('name', document.getElementById('name').value);
        form.append('email', document.getElementById('email').value);
        form.append('photo', document.getElementById('photo').files[0]);

        updateUserData(form, 'data')
    })
};

if (userPasswordFrom) {
    userPasswordFrom.addEventListener('submit', async e => {
        e.preventDefault();
        document.querySelector('.btn--save-password').textContent = 'Updating...'
        const currentPassword = document.getElementById('password-current').value;
        const password = document.getElementById('password').value;
        const passwordConfirm = document.getElementById('password-confirm').value;
        await updateUserData({ currentPassword, password, passwordConfirm }, 'password');

        document.querySelector('.btn--save-password').textContent = 'Save Password';
        document.getElementById('password-current').value = '';
        document.getElementById('password').value = '';
        document.getElementById('password-confirm').value = '';
    })
};

if (bookTourBtn) {
    bookTourBtn.addEventListener('click', e => {
        e.target.textContent = 'Processing...';
        const { tourId } = e.target.dataset;
        bookTour(tourId);
    })
};