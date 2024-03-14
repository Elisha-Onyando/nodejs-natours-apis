import axios from "axios";
import { showAlert } from "./alerts";

export const login = async (email, password) => {
    try {
        const res = await axios({
            method: 'POST',
            url: 'http://localhost:3000/api/v1/users/login',
            data: {
                email: email,
                password: password
            }
        });
        if (res.data.statusCode === '00') {
            showAlert('success', 'Logged in successfully');
            window.setTimeout(() => {
                location.assign('/')
            }, 1500);
        }
    } catch (err) {
        showAlert('error', err.response.data.statusMessage);
    }
};

export const logout = async () => {
    try {
        const res = await axios({
            method: 'GET',
            url: 'http://localhost:3000/api/v1/users/logout',
        });
        if (res.data.statusCode === '00') {
            location.reload(true)
        }
    } catch (err) {
        showAlert('error', 'Error while logging out. Please try again!');
    }
};